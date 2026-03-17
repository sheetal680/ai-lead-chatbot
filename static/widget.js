/**
 * LeadBot Chat Widget
 * Drop-in embeddable AI lead-capture chatbot.
 *
 * Usage on any site:
 *   <script src="https://yourdomain.com/static/widget.js"
 *           data-api="https://yourdomain.com"
 *           data-name="Acme Corp"></script>
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

  /* ── State ───────────────────────────────────────────────────── */
  const state = {
    open: false,
    history: [],          // [{role, content}]
    msgCount: 0,          // user message count
    leadCaptured: false,
    leadFormShown: false,
    typing: false,
    pendingUserMsg: null,  // message waiting for lead capture
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
    // Inject CSS if not already present (supports external embed)
    if (!document.getElementById('lcw-styles')) {
      const link = document.createElement('link');
      link.id = 'lcw-styles';
      link.rel = 'stylesheet';
      link.href = cfg.apiBase + '/static/widget.css';
      document.head.appendChild(link);
    }

    const root = document.createElement('div');
    root.id = 'lcw-root';

    root.innerHTML = `
      <!-- Bubble -->
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

      <!-- Chat window -->
      <div id="lcw-window" class="lcw-hidden" role="dialog" aria-label="Chat window">

        <!-- Header -->
        <div id="lcw-header">
          <div class="lcw-avatar">&#129302;</div>
          <div class="lcw-header-info">
            <div class="lcw-header-name">${esc(cfg.businessName)}</div>
            <div class="lcw-header-status">Online · Typically replies instantly</div>
          </div>
          <button id="lcw-close-btn" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div id="lcw-messages"></div>

        <!-- Lead capture form (hidden initially) -->
        <div id="lcw-lead-form" style="display:none;">
          <h4>Just one more step</h4>
          <p>To continue the conversation and follow up with you, we'd love your contact details.</p>
          <input class="lcw-field" id="lcw-f-name"  type="text"  placeholder="Your name *"  autocomplete="name" />
          <input class="lcw-field" id="lcw-f-email" type="email" placeholder="Email address *" autocomplete="email" />
          <input class="lcw-field" id="lcw-f-phone" type="tel"   placeholder="Phone (optional)" autocomplete="tel" />
          <button class="lcw-submit" id="lcw-lead-submit">Continue conversation &#8594;</button>
        </div>

        <!-- Input area -->
        <div id="lcw-input-area">
          <textarea id="lcw-input" placeholder="Type a message…" rows="1" aria-label="Message input"></textarea>
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

    // Transition message
    appendMessage(
      'bot',
      `You're doing great! To keep the conversation going and make sure we can follow up with you, could you share your name and email? It only takes a second.`
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
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

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
    appendMessage('bot', `Thanks, ${name}! I've got your details. Let's continue — how else can I help you today?`);

    // Resume pending message if any
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

    // Show lead form after threshold messages if not yet captured
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
        `Hi there! I'm the ${cfg.businessName} assistant. How can I help you today? Feel free to ask me anything.`
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

    // Reset field highlight on input
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

    // Expose public API
    window.__chatWidget = { open: openWidget, close: closeWidget };

    // Show notification dot after 3 seconds if not opened
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
