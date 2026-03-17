import os
import json
import uuid
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Allow cross-origin requests to API endpoints so embed.js works on external sites
CORS(app, resources={
    r"/chat": {"origins": "*"},
    r"/capture-lead": {"origins": "*"},
})

# Groq is OpenAI-API-compatible, free tier, no credit card required.
# Get your free key at: https://console.groq.com
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

LEADS_FILE = "leads.json"
FAQS_FILE = "faqs.json"

BUSINESS_NAME = os.getenv("BUSINESS_NAME", "Our Business")
BUSINESS_DESCRIPTION = os.getenv("BUSINESS_DESCRIPTION", "We provide excellent services to our customers.")
DASHBOARD_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "admin123")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_json(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return default


def save_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def build_system_prompt() -> str:
    faqs = load_json(FAQS_FILE, [])
    faq_block = ""
    if faqs:
        faq_block = "\n\nFrequently Asked Questions:\n"
        for i, faq in enumerate(faqs, 1):
            faq_block += f"{i}. Q: {faq.get('question', '')}\n   A: {faq.get('answer', '')}\n"

    return (
        f"You are a friendly and professional AI assistant for {BUSINESS_NAME}. "
        f"{BUSINESS_DESCRIPTION}\n\n"
        "Your role is to answer visitor questions helpfully, warmly, and concisely. "
        "If a question is not covered by the FAQs below, answer based on general knowledge "
        "while staying relevant to the business context. "
        "Keep responses under 3 sentences when possible. "
        "Never make up specific pricing, dates, or commitments the business hasn't stated."
        f"{faq_block}"
    )


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("authenticated"):
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html", business_name=BUSINESS_NAME)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    history = data.get("history", [])   # list of {role, content}

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    messages = [{"role": "system", "content": build_system_prompt()}]

    # Carry forward conversation history (last 10 turns to stay within tokens)
    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        reply = response.choices[0].message.content.strip()
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/capture-lead", methods=["POST"])
def capture_lead():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    message = data.get("message", "").strip()

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    leads = load_json(LEADS_FILE, [])
    lead = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    leads.append(lead)
    save_json(LEADS_FILE, leads)

    return jsonify({"success": True, "message": "Lead captured successfully"})


@app.route("/leads/login", methods=["GET", "POST"])
def login_page():
    error = None
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == DASHBOARD_PASSWORD:
            session["authenticated"] = True
            return redirect(url_for("leads_dashboard"))
        error = "Incorrect password. Please try again."
    return render_template("login.html", error=error)


@app.route("/leads/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))


@app.route("/leads")
@login_required
def leads_dashboard():
    leads = load_json(LEADS_FILE, [])
    # Sort newest first
    leads.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return render_template("dashboard.html", leads=leads, business_name=BUSINESS_NAME)


@app.route("/leads/export")
@login_required
def export_leads():
    import csv
    import io
    leads = load_json(LEADS_FILE, [])
    leads.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "name", "email", "phone", "message", "timestamp"],
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(leads)

    from flask import Response
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


@app.route("/embed-code")
def embed_code():
    host = request.host_url.rstrip("/")
    snippet = f'<script src="{host}/static/embed.js"\n        data-api="{host}"\n        data-name="{BUSINESS_NAME}"\n        data-lead-threshold="3"></script>'
    return render_template("embed_code.html", snippet=snippet, business_name=BUSINESS_NAME)


if __name__ == "__main__":
    # Ensure data files exist
    if not os.path.exists(LEADS_FILE):
        save_json(LEADS_FILE, [])
    app.run(debug=True, port=5000)
