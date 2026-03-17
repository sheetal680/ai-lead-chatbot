# LeadBot AI — Embeddable AI Lead Capture Chatbot

A production-ready, embeddable AI chatbot that answers visitor questions using your custom FAQs and automatically captures leads (name, email, phone) after a configurable number of messages. Built with Python, Flask, and OpenAI.

---

## Features

- **AI-powered responses** — GPT-4o-mini answers questions using your FAQ context
- **Smart lead capture** — Politely prompts for contact details after N messages
- **One-line embed** — Drop two `<script>` tags on any website
- **Leads dashboard** — Password-protected table with search + CSV export
- **Zero database** — All data stored in local JSON files
- **Premium dark UI** — Smooth animations, typing indicators, mobile-responsive

---

## Screenshots

> _Chat widget on a client site_
> ![Chat Widget](docs/screenshot-widget.png)

> _Leads dashboard_
> ![Dashboard](docs/screenshot-dashboard.png)

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone https://github.com/yourname/ai-lead-chatbot.git
cd ai-lead-chatbot
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=sk-...
DASHBOARD_PASSWORD=your-secure-password
BUSINESS_NAME=Acme Corp
BUSINESS_DESCRIPTION=We provide cloud software solutions for small businesses.
```

### 3. Run the server

```bash
python app.py
```

Open [http://localhost:5000](http://localhost:5000) — the chat widget appears immediately.

---

## Project Structure

```
ai-lead-chatbot/
├── app.py                  # Flask backend
├── faqs.json               # Your custom FAQs (edit freely)
├── leads.json              # Captured leads (auto-generated)
├── requirements.txt
├── .env.example
├── embed.html              # Demo: how clients embed the widget
├── static/
│   ├── widget.js           # Self-contained chat widget
│   └── widget.css          # Premium dark theme styles
└── templates/
    ├── index.html          # Landing page
    ├── dashboard.html      # Leads dashboard
    └── login.html          # Dashboard login
```

---

## Customizing FAQs

Edit `faqs.json` — no coding required. Add as many Q&A pairs as you like:

```json
[
  {
    "question": "What services do you offer?",
    "answer": "We offer web design, SEO, and paid ads management."
  },
  {
    "question": "How much does it cost?",
    "answer": "Plans start at $299/month. Contact us for a custom quote."
  }
]
```

The AI automatically uses these as context. If a question isn't covered, it falls back to general helpful responses relevant to your business description.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page with embedded chat widget |
| `POST` | `/chat` | Send a message, receive AI reply |
| `POST` | `/capture-lead` | Save lead (name, email, phone, message) |
| `GET` | `/leads` | Dashboard (password protected) |
| `GET` | `/leads/export` | Download all leads as CSV |
| `GET` | `/leads/login` | Dashboard login page |
| `GET` | `/leads/logout` | Logout |

### POST `/chat`

```json
// Request
{ "message": "What are your prices?", "history": [] }

// Response
{ "reply": "Our plans start at $299/month..." }
```

### POST `/capture-lead`

```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "phone": "555-1234", "message": "Interested in SEO" }

// Response
{ "success": true, "message": "Lead captured successfully" }
```

---

## Embedding on Any Website

Paste these two lines before the `</body>` tag on your client's site:

```html
<!-- LeadBot Chat Widget -->
<script>
  window.ChatWidgetConfig = {
    apiBase: "https://your-leadbot-domain.com",
    businessName: "Acme Corp"
  };
</script>
<script src="https://your-leadbot-domain.com/static/widget.js"></script>
```

That's it. The widget self-injects its CSS and renders the floating bubble.

### Widget configuration options

| Option | Default | Description |
|--------|---------|-------------|
| `apiBase` | `''` (same origin) | URL of your LeadBot server |
| `businessName` | `'Assistant'` | Name shown in chat header |
| `leadThreshold` | `3` | Messages before lead form appears |

You can also use `data-*` attributes on the script tag:

```html
<script src="https://your-domain.com/static/widget.js"
        data-api="https://your-domain.com"
        data-name="Acme Corp"
        data-lead-threshold="4">
</script>
```

See `embed.html` for a full working demo.

---

## Deploying

### Railway / Render / Fly.io

1. Push your repo
2. Set environment variables in the dashboard
3. Start command: `python app.py`

### With Gunicorn (production)

```bash
pip install gunicorn
gunicorn app:app --bind 0.0.0.0:8000 --workers 2
```

> **Note:** `leads.json` and `faqs.json` are written to disk. For persistent storage on ephemeral platforms (Render free tier, etc.), mount a persistent volume or swap to a database.

---

## Lead Dashboard

Visit `/leads` (e.g. `http://localhost:5000/leads`) and enter your `DASHBOARD_PASSWORD`.

Features:
- Total leads count + phone capture rate
- Live search across name, email, message
- One-click CSV export
- Newest leads first

---

## Customization Tips

- **Change the color scheme** — Edit `--purple` in `widget.css` (default `#6C63FF`)
- **Adjust lead trigger** — Set `data-lead-threshold="5"` in the embed tag
- **Add email notifications** — Uncomment the `smtplib` block in `app.py` (see inline comments)
- **System prompt** — Edit `build_system_prompt()` in `app.py` to change AI personality

---

## Tech Stack

- **Backend:** Python 3.10+, Flask 3, OpenAI Python SDK
- **AI:** GPT-4o-mini (fast, cheap, capable)
- **Frontend:** Vanilla JS + CSS (zero dependencies)
- **Storage:** JSON files (no database required)

---

## License

MIT — use freely in client projects.
