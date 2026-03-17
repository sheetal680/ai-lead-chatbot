/**
 * LeadBot Chat Widget — Standalone Embeddable Version
 * All CSS is bundled inline; no external files needed.
 *
 * Usage (add to ANY website):
 *   <script src="https://your-domain.com/static/embed.js"
 *           data-api="https://your-domain.com"
 *           data-name="Acme Corp"
 *           data-lead-threshold="3"></script>
 *
 * Or configure via window object before the script tag:
 *   <script>window.ChatWidgetConfig = { apiBase: '...', businessName: '...' };</script>
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────────── */
  const cfg = (function () {
    const s = document.currentScript;
    const winCfg = window.ChatWidgetConfig || {};
    return {
      apiBase: (s && s.getAttribute('data-api')) || winCfg.apiBase || '',
      businessName: (s && s.getAttribute('data-name')) || winCfg.businessName || 'Assistant',
      leadThreshold: parseInt((s && s.getAttribute('data-lead-threshold')) || winCfg.leadThreshold || '3', 10),
    };
  })();

  /* ── Inline CSS ──────────────────────────────────────────────── */
  const CSS = `
#lcw-root *,
#lcw-root *::before,
#lcw-root *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
#lcw-bubble {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 2147483646;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C63FF, #574fd6);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(108,99,255,.55), 0 2px 8px rgba(0,0,0,.4);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
  outline: none;
}
#lcw-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(108,99,255,.7), 0 4px 12px rgba(0,0,0,.4);
}
#lcw-bubble svg { transition: transform .3s, opacity .3s; }
#lcw-bubble.open .lcw-icon-chat { transform: scale(0) rotate(-90deg); opacity: 0; position: absolute; }
#lcw-bubble.open .lcw-icon-close { transform: scale(1) rotate(0); opacity: 1; }
#lcw-bubble:not(.open) .lcw-icon-close { transform: scale(0) rotate(90deg); opacity: 0; position: absolute; }
#lcw-bubble:not(.open) .lcw-icon-chat { transform: scale(1); opacity: 1; }
#lcw-notif {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #ff4757;
  border-radius: 50%;
  border: 2px solid #0d0d1a;
  animation: lcw-pulse 2s infinite;
  display: none;
}
@keyframes lcw-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,71,87,.6); }
  50% { box-shadow: 0 0 0 6px rgba(255,71,87,0); }
}
#lcw-window {
  position: fixed;
  bottom: 100px;
  right: 28px;
  z-index: 2147483645;
  width: 380px;
  height: 580px;
  background: #1a1a2e;
  border: 1px solid rgba(108,99,255,.25);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
  overflow: hidden;
  transform-origin: bottom right;
  transition: transform .35s cubic-bezier(.34,1.56,.64,1), opacity .3s;
}
#lcw-window.lcw-hidden {
  transform: scale(.85) translateY(20px);
  opacity: 0;
  pointer-events: none;
}
#lcw-window.lcw-visible {
  transform: scale(1) translateY(0);
  opacity: 1;
}
#lcw-header {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(108,99,255,.2), rgba(87,79,214,.1));
  border-bottom: 1px solid rgba(108,99,255,.15);
  display: flex;
  align-items: center;
  gap: .85rem;
  flex-shrink: 0;
}
.lcw-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C63FF, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  position: relative;
}
.lcw-avatar::after {
  content: '';
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: #2ecc71;
  border-radius: 50%;
  border: 2px solid #1a1a2e;
}
.lcw-header-info { flex: 1; }
.lcw-header-name { font-size: .95rem; font-weight: 700; color: #e8e8f0; }
.lcw-header-status { font-size: .75rem; color: #8888aa; margin-top: .1rem; }
#lcw-close-btn {
  background: none;
  border: none;
  color: #8888aa;
  cursor: pointer;
  padding: .3rem;
  border-radius: 8px;
  transition: background .2s, color .2s;
  display: flex;
  align-items: center;
}
#lcw-close-btn:hover { background: rgba(255,255,255,.08); color: #e8e8f0; }
#lcw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .85rem;
  scroll-behavior: smooth;
}
#lcw-messages::-webkit-scrollbar { width: 4px; }
#lcw-messages::-webkit-scrollbar-track { background: transparent; }
#lcw-messages::-webkit-scrollbar-thumb { background: rgba(108,99,255,.3); border-radius: 999px; }
.lcw-msg {
  display: flex;
  align-items: flex-end;
  gap: .5rem;
  animation: lcw-msg-in .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lcw-msg-in {
  from { opacity: 0; transform: translateY(10px) scale(.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.lcw-msg.lcw-user { flex-direction: row-reverse; }
.lcw-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6C63FF, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  flex-shrink: 0;
  color: #fff;
}
.lcw-bubble {
  max-width: 78%;
  padding: .7rem 1rem;
  border-radius: 16px;
  font-size: .9rem;
  line-height: 1.55;
  word-break: break-word;
}
.lcw-bot .lcw-bubble {
  background: #16213e;
  color: #e8e8f0;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(108,99,255,.12);
}
.lcw-user .lcw-bubble {
  background: linear-gradient(135deg, #6C63FF, #574fd6);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 15px rgba(108,99,255,.3);
}
.lcw-msg-time {
  font-size: .68rem;
  color: #55557a;
  margin-top: .25rem;
  padding: 0 .3rem;
}
.lcw-user .lcw-msg-time { text-align: right; }
.lcw-typing .lcw-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: .85rem 1rem;
}
.lcw-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6C63FF;
  animation: lcw-bounce .9s infinite;
}
.lcw-dot:nth-child(2) { animation-delay: .15s; }
.lcw-dot:nth-child(3) { animation-delay: .3s; }
@keyframes lcw-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .5; }
  30% { transform: translateY(-6px); opacity: 1; }
}
#lcw-lead-form {
  background: #16213e;
  border-top: 1px solid rgba(108,99,255,.15);
  padding: 1.25rem 1rem;
  flex-shrink: 0;
  animation: lcw-form-in .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes lcw-form-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
#lcw-lead-form h4 {
  font-size: .875rem;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: .2rem;
}
#lcw-lead-form p {
  font-size: .78rem;
  color: #8888aa;
  margin-bottom: .85rem;
  line-height: 1.5;
}
.lcw-field {
  width: 100%;
  padding: .6rem .85rem;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(108,99,255,.2);
  border-radius: 10px;
  color: #e8e8f0;
  font-size: .875rem;
  outline: none;
  transition: border-color .2s, background .2s;
  margin-bottom: .5rem;
}
.lcw-field:focus { border-color: #6C63FF; background: rgba(108,99,255,.06); }
.lcw-field::placeholder { color: #55557a; }
.lcw-submit {
  width: 100%;
  padding: .7rem;
  background: linear-gradient(135deg, #6C63FF, #574fd6);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: .35rem;
  transition: opacity .2s, transform .1s;
  box-shadow: 0 4px 15px rgba(108,99,255,.3);
}
.lcw-submit:hover { opacity: .9; }
.lcw-submit:active { transform: scale(.98); }
#lcw-input-area {
  padding: .85rem 1rem;
  border-top: 1px solid rgba(108,99,255,.12);
  display: flex;
  align-items: flex-end;
  gap: .65rem;
  background: #1a1a2e;
  flex-shrink: 0;
}
#lcw-input {
  flex: 1;
  min-height: 40px;
  max-height: 110px;
  padding: .6rem .9rem;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(108,99,255,.2);
  border-radius: 12px;
  color: #e8e8f0;
  font-size: .9rem;
  outline: none;
  resize: none;
  transition: border-color .2s;
  line-height: 1.5;
  font-family: inherit;
}
#lcw-input:focus { border-color: #6C63FF; }
#lcw-input::placeholder { color: #55557a; }
#lcw-send {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6C63FF, #574fd6);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity .2s, transform .15s;
  box-shadow: 0 4px 12px rgba(108,99,255,.35);
}
#lcw-send:hover { opacity: .9; }
#lcw-send:active { transform: scale(.92); }
#lcw-send:disabled { opacity: .4; cursor: not-allowed; }
.lcw-powered {
  text-align: center;
  font-size: .68rem;
  color: #33334a;
  padding: .4rem 0 .1rem;
  flex-shrink: 0;
}
@media (max-width: 480px) {
  #lcw-window {
    right: 0; left: 0; bottom: 0;
    width: 100%;
    height: 92dvh;
    border-radius: 20px 20px 0 0;
  }
  #lcw-bubble { bottom: 20px; right: 20px; }
}
`;

  /* ── State ───────────────────────────────────────────────────── */
  const state = {
    open: false,
    history: [],
    msgCount: 0,
    leadCaptured: false,
    leadFormShown: false,
    typing: false,
    pendingUserMsg: null,
  };

  /* ── Helpers ─────────────────────────────────────────────────── */
  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollBottom() {
    const m = document.getElementById('lcw-messages');
    if (m) m.scrollTop = m.scrollHeight;
  }

  /* ── DOM Builder ─────────────────────────────────────────────── */
  function buildWidget() {
    // Inject CSS inline (no external file needed — works cross-origin)
    if (!document.getElementById('lcw-styles')) {
      const style = document.createElement('style');
      style.id = 'lcw-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    const root = document.createElement('div');
    root.id = 'lcw-root';

    root.innerHTML = `
      <button id="lcw-bubble" aria-label="Open chat">
        <svg class="lcw-icon-chat" width="26" height="26" viewBox="0 0 24 24"
             fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg class="lcw-icon-close" width="22" height="22" viewBox="0 0 24 24"
             fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span id="lcw-notif"></span>
      </button>

      <div id="lcw-window" class="lcw-hidden" role="dialog" aria-label="Chat window">
        <div id="lcw-header">
          <div class="lcw-avatar">&#129302;</div>
          <div class="lcw-header-info">
            <div class="lcw-header-name">${esc(cfg.businessName)}</div>
            <div class="lcw-header-status">Online &middot; Typically replies instantly</div>
          </div>
          <button id="lcw-close-btn" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="lcw-messages"></div>

        <div id="lcw-lead-form" style="display:none;">
          <h4>Just one more step</h4>
          <p>To continue the conversation and follow up with you, we'd love your contact details.</p>
          <input class="lcw-field" id="lcw-f-name"  type="text"  placeholder="Your name *"   autocomplete="name" />
          <input class="lcw-field" id="lcw-f-email" type="email" placeholder="Email address *" autocomplete="email" />
          <input class="lcw-field" id="lcw-f-phone" type="tel"   placeholder="Phone (optional)" autocomplete="tel" />
          <button class="lcw-submit" id="lcw-lead-submit">Continue conversation &#8594;</button>
        </div>

        <div id="lcw-input-area">
          <textarea id="lcw-input" placeholder="Type a message\u2026" rows="1" aria-label="Message input"></textarea>
          <button id="lcw-send" aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div class="lcw-powered">Powered by LeadBot AI</div>
      </div>
    `;

    document.body.appendChild(root);
  }

  /* ── Render a message ────────────────────────────────────────── */
  function appendMessage(role, text, ts) {
    const container = document.getElementById('lcw-messages');
    if (!container) return;

    const isUser = role === 'user';
    const wrapper = document.createElement('div');
    wrapper.className = `lcw-msg lcw-${isUser ? 'user' : 'bot'}`;

    const avatarIcon = isUser
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>'
      : '&#129302;';

    wrapper.innerHTML = `
      <div class="lcw-msg-avatar">${avatarIcon}</div>
      <div>
        <div class="lcw-bubble">${esc(text)}</div>
        <div class="lcw-msg-time">${ts || now()}</div>
      </div>
    `;

    container.appendChild(wrapper);
    scrollBottom();
    return wrapper;
  }

  /* ── Typing indicator ────────────────────────────────────────── */
  function showTyping() {
    const container = document.getElementById('lcw-messages');
    if (!container || state.typing) return;
    state.typing = true;

    const el = document.createElement('div');
    el.id = 'lcw-typing-indicator';
    el.className = 'lcw-msg lcw-bot lcw-typing';
    el.innerHTML = `
      <div class="lcw-msg-avatar">&#129302;</div>
      <div class="lcw-bubble">
        <span class="lcw-dot"></span>
        <span class="lcw-dot"></span>
        <span class="lcw-dot"></span>
      </div>
    `;
    container.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    state.typing = false;
    const el = document.getElementById('lcw-typing-indicator');
    if (el) el.remove();
  }

  /* ── Send message to API ─────────────────────────────────────── */
  async function sendMessage(text) {
    appendMessage('user', text);
    state.history.push({ role: 'user', content: text });
    showTyping();

    const sendBtn = document.getElementById('lcw-send');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await fetch(cfg.apiBase + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: state.history }),
      });
      const data = await res.json();
      hideTyping();

      const reply = data.reply || "I'm sorry, I couldn't process that. Please try again.";
      appendMessage('bot', reply);
      state.history.push({ role: 'assistant', content: reply });
    } catch (err) {
      hideTyping();
      appendMessage('bot', 'Sorry, something went wrong. Please try again shortly.');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      const input = document.getElementById('lcw-input');
      if (input) { input.focus(); autoGrow(input); }
    }
  }

  /* ── Lead capture flow ───────────────────────────────────────── */
  function showLeadForm(pendingMsg) {
    state.leadFormShown = true;
    state.pendingUserMsg = pendingMsg;

    const form = document.getElementById('lcw-lead-form');
    const inputArea = document.getElementById('lcw-input-area');
    if (form) form.style.display = 'block';
    if (inputArea) inputArea.style.display = 'none';

    appendMessage(
      'bot',
      "You're doing great! To keep the conversation going and make sure we can follow up with you, could you share your name and email? It only takes a second."
    );
    scrollBottom();

    const nameField = document.getElementById('lcw-f-name');
    if (nameField) setTimeout(() => nameField.focus(), 300);
  }

  function hideLeadForm() {
    const form = document.getElementById('lcw-lead-form');
    const inputArea = document.getElementById('lcw-input-area');
    if (form) form.style.display = 'none';
    if (inputArea) inputArea.style.display = 'flex';
  }

  async function submitLead() {
    const name = (document.getElementById('lcw-f-name')?.value || '').trim();
    const email = (document.getElementById('lcw-f-email')?.value || '').trim();
    const phone = (document.getElementById('lcw-f-phone')?.value || '').trim();

    if (!name || !email) {
      const nameField = document.getElementById('lcw-f-name');
      const emailField = document.getElementById('lcw-f-email');
      if (!name && nameField) { nameField.style.borderColor = '#ff4757'; nameField.focus(); }
      else if (!email && emailField) { emailField.style.borderColor = '#ff4757'; emailField.focus(); }
      return;
    }

    const btn = document.getElementById('lcw-lead-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving\u2026'; }

    try {
      await fetch(cfg.apiBase + '/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message: state.history.find(m => m.role === 'user')?.content || '',
        }),
      });
    } catch (_) { /* non-blocking */ }

    state.leadCaptured = true;
    hideLeadForm();
    appendMessage('bot', `Thanks, ${esc(name)}! I've got your details. Let's continue \u2014 how else can I help you today?`);

    if (state.pendingUserMsg) {
      const pending = state.pendingUserMsg;
      state.pendingUserMsg = null;
      await sendMessage(pending);
    }

    const input = document.getElementById('lcw-input');
    if (input) input.focus();
  }

  /* ── Handle user send ────────────────────────────────────────── */
  async function handleSend() {
    const input = document.getElementById('lcw-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    autoGrow(input);
    state.msgCount++;

    if (!state.leadCaptured && !state.leadFormShown && state.msgCount >= cfg.leadThreshold) {
      showLeadForm(text);
      return;
    }

    await sendMessage(text);
  }

  /* ── Auto-grow textarea ──────────────────────────────────────── */
  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 110) + 'px';
  }

  /* ── Open / close ────────────────────────────────────────────── */
  function openWidget() {
    state.open = true;
    const win = document.getElementById('lcw-window');
    const bubble = document.getElementById('lcw-bubble');
    const notif = document.getElementById('lcw-notif');
    if (win) { win.classList.remove('lcw-hidden'); win.classList.add('lcw-visible'); }
    if (bubble) bubble.classList.add('open');
    if (notif) notif.style.display = 'none';
    scrollBottom();
    const input = document.getElementById('lcw-input');
    if (input) setTimeout(() => input.focus(), 350);
  }

  function closeWidget() {
    state.open = false;
    const win = document.getElementById('lcw-window');
    const bubble = document.getElementById('lcw-bubble');
    if (win) { win.classList.add('lcw-hidden'); win.classList.remove('lcw-visible'); }
    if (bubble) bubble.classList.remove('open');
  }

  /* ── Greeting ────────────────────────────────────────────────── */
  function sendGreeting() {
    setTimeout(() => {
      appendMessage(
        'bot',
        `Hi there! I'm the ${esc(cfg.businessName)} assistant. How can I help you today? Feel free to ask me anything.`
      );
    }, 500);
  }

  /* ── Event wiring ────────────────────────────────────────────── */
  function wireEvents() {
    document.getElementById('lcw-bubble')?.addEventListener('click', () => {
      state.open ? closeWidget() : openWidget();
    });

    document.getElementById('lcw-close-btn')?.addEventListener('click', closeWidget);
    document.getElementById('lcw-send')?.addEventListener('click', handleSend);

    document.getElementById('lcw-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    document.getElementById('lcw-input')?.addEventListener('input', function () {
      autoGrow(this);
    });

    document.getElementById('lcw-lead-submit')?.addEventListener('click', submitLead);

    ['lcw-f-name', 'lcw-f-email'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', function () {
        this.style.borderColor = '';
      });
    });
  }

  /* ── Init ────────────────────────────────────────────────────── */
  function init() {
    buildWidget();
    wireEvents();
    sendGreeting();

    window.__chatWidget = { open: openWidget, close: closeWidget };

    setTimeout(() => {
      if (!state.open) {
        const notif = document.getElementById('lcw-notif');
        if (notif) notif.style.display = 'block';
      }
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
