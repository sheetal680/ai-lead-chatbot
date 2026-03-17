#!/usr/bin/env bash
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ____            _ _      ____       _       _     _   "
echo " / ___| _ __ ___ (_) | ___| __ ) _ __(_) __ _| |__ | |_ "
echo " \___ \| '_ \` _ \| | |/ _ \  _ \| '__| |/ _\` | '_ \| __|"
echo "  ___) | | | | | | | |  __/ |_) | |  | | (_| | | | | |_ "
echo " |____/|_| |_| |_|_|_|\___|____/|_|  |_|\__, |_| |_|\__|"
echo "                                         |___/           "
echo -e "${NC}"

# ── Virtual environment ───────────────────────────────────────────────────────
if [ ! -d "venv" ]; then
  echo -e "${YELLOW}▶ Creating virtual environment...${NC}"
  python3 -m venv venv
  echo -e "${GREEN}✔ Virtual environment created.${NC}"
else
  echo -e "${GREEN}✔ Virtual environment already exists.${NC}"
fi

# ── Activate ──────────────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Activating virtual environment...${NC}"
# shellcheck disable=SC1091
source venv/bin/activate || source venv/Scripts/activate

# ── Install dependencies ──────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Installing dependencies...${NC}"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}✔ Dependencies installed.${NC}"

# ── Environment file ──────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  No .env found — copied from .env.example.${NC}"
  echo -e "${RED}   → Open .env and add your GROQ_API_KEY before continuing.${NC}"
  echo -e "${CYAN}   → Get a free key (no credit card) at: https://console.groq.com${NC}"
  echo ""
  read -r -p "   Press Enter once you've saved your API key, or Ctrl+C to exit... "
  echo ""
else
  echo -e "${GREEN}✔ .env file found.${NC}"
fi

# ── Check API key is set ──────────────────────────────────────────────────────
if grep -qE '^GROQ_API_KEY=your-groq-api-key-here$|^GROQ_API_KEY=$' .env 2>/dev/null; then
  echo -e "${RED}✘ GROQ_API_KEY is not set in .env. Please add your key and re-run.${NC}"
  echo -e "${CYAN}  → Get a free key at: https://console.groq.com${NC}"
  exit 1
fi

# ── Start Flask ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✔ All checks passed. Starting SmileBright Dental chatbot...${NC}"
echo ""
echo -e "${CYAN}  Demo chat:    http://localhost:5000${NC}"
echo -e "${CYAN}  Embed code:   http://localhost:5000/embed-code${NC}"
echo -e "${CYAN}  Leads board:  http://localhost:5000/leads${NC}"
echo ""
python app.py
