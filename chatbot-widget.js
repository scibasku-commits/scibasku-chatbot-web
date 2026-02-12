// Scibasku Chatbot Widget - Self-contained, embeddable via single <script> tag
// Usage: <script src="https://scibasku-chatbot-web.vercel.app/chatbot-widget.js"></script>

(function() {
    'use strict';

    // === CONFIG ===
    var API_URL = 'https://scibasku-chatbot-web.vercel.app/api/chat';
    var AUTO_OPEN_DELAY = 10000; // 10 seconds
    var CHAT_TIMEOUT = 18000; // 18 seconds
    var ADMIN_POLL_INTERVAL = 3000; // 3 seconds
    var chatHistory = [];
    var chatClosedByUser = false;
    var sessionId = null;
    var adminPollTimer = null;
    var lastAdminId = 0;
    var isTakenOver = false;

    // === PILL SYSTEM ===
    var pillPool = [
        {emoji: '\uD83E\uDD3F', text: 'Mejor epoca buceo Maldivas?'},
        {emoji: '\u26F7\uFE0F', text: 'Niseko vs Alpes: cual elegir?'},
        {emoji: '\uD83C\uDFD6\uFE0F', text: 'Que incluye all-inclusive Cocoon?'},
        {emoji: '\u2708\uFE0F', text: 'Vuelos a Maldivas desde Espana?'},
        {emoji: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67', text: 'Viajes esqui con ninos?'},
        {emoji: '\uD83D\uDEA2', text: 'Cuanto cuesta un liveaboard?'},
        {emoji: '\uD83E\uDD81', text: 'Safari Kenia: cuando ir?'},
        {emoji: '\uD83C\uDFBF', text: 'Heli-ski en Canada: que nivel?'}
    ];
    var usedPills = [];
    var VISIBLE_PILLS = 4;

    // === INJECT CSS ===
    var style = document.createElement('style');
    style.textContent = '' +
        '#scb-toggle {' +
        '  position: fixed; bottom: 20px; right: 20px;' +
        '  width: 65px; height: 65px; border-radius: 50%;' +
        '  background: #d4af37; color: #0a1628 !important;' +
        '  border: none; cursor: pointer; font-size: 1.5rem;' +
        '  display: flex; align-items: center; justify-content: center;' +
        '  box-shadow: 0 4px 20px rgba(212,175,55,0.4);' +
        '  z-index: 99999; transition: all 0.3s;' +
        '  font-family: sans-serif;' +
        '}' +
        '#scb-toggle:hover { transform: scale(1.1); background: #e0c050; }' +
        '#scb-toggle.scb-pulse { animation: scb-pulse 2s ease-in-out 3; }' +
        '@keyframes scb-pulse {' +
        '  0%, 100% { box-shadow: 0 4px 20px rgba(212,175,55,0.4); }' +
        '  50% { box-shadow: 0 4px 30px rgba(212,175,55,0.7); }' +
        '}' +
        '#scb-panel {' +
        '  position: fixed; bottom: 95px; right: 20px;' +
        '  width: 380px; max-width: calc(100vw - 40px);' +
        '  max-height: 520px; background: #0d2847;' +
        '  border: 1px solid rgba(212,175,55,0.3);' +
        '  border-radius: 16px; display: none; flex-direction: column;' +
        '  z-index: 99999; box-shadow: 0 10px 40px rgba(0,0,0,0.5);' +
        '  overflow: hidden; font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;' +
        '}' +
        '#scb-panel.scb-open {' +
        '  display: flex; animation: scb-slideUp 0.3s ease;' +
        '}' +
        '@keyframes scb-slideUp {' +
        '  from { opacity: 0; transform: translateY(20px); }' +
        '  to { opacity: 1; transform: translateY(0); }' +
        '}' +
        '.scb-header {' +
        '  padding: 1rem 1.2rem;' +
        '  background: rgba(212,175,55,0.1);' +
        '  border-bottom: 1px solid rgba(212,175,55,0.2);' +
        '  display: flex; justify-content: space-between; align-items: center;' +
        '}' +
        '.scb-header h3 {' +
        '  font-family: "Playfair Display", Georgia, serif;' +
        '  font-size: 1rem; color: #d4af37 !important; margin: 0;' +
        '  font-weight: 700; line-height: 1.3;' +
        '}' +
        '.scb-close {' +
        '  background: none; border: none; color: #b8c5d6 !important;' +
        '  font-size: 1.4rem; cursor: pointer; padding: 0 4px;' +
        '  line-height: 1;' +
        '}' +
        '.scb-close:hover { color: #ffffff !important; }' +
        '.scb-messages {' +
        '  flex: 1; overflow-y: auto; padding: 1rem;' +
        '  min-height: 200px; max-height: 300px;' +
        '}' +
        '.scb-msg {' +
        '  margin-bottom: 0.8rem; padding: 0.7rem 1rem;' +
        '  border-radius: 12px; font-size: 0.85rem;' +
        '  line-height: 1.5; max-width: 90%; word-wrap: break-word;' +
        '}' +
        '.scb-msg.scb-bot {' +
        '  background: rgba(212,175,55,0.1);' +
        '  border: 1px solid rgba(212,175,55,0.2);' +
        '  color: #e2e8f0 !important;' +
        '}' +
        '.scb-msg.scb-bot strong { color: #d4af37 !important; font-weight: 600; }' +
        '.scb-msg.scb-bot br { margin-bottom: 0.3rem; }' +
        '.scb-msg.scb-user {' +
        '  background: #d4af37; color: #0a1628 !important;' +
        '  margin-left: auto;' +
        '}' +
        '.scb-msg.scb-error {' +
        '  background: rgba(229,57,53,0.15);' +
        '  border: 1px solid rgba(229,57,53,0.3);' +
        '  color: #f87171 !important;' +
        '}' +
        '.scb-pills {' +
        '  padding: 0.5rem 1rem; display: flex;' +
        '  flex-wrap: wrap; gap: 6px;' +
        '}' +
        '.scb-pill {' +
        '  background: rgba(31,180,209,0.15);' +
        '  border: 1px solid rgba(31,180,209,0.3);' +
        '  color: #1fb4d1 !important; border-radius: 20px;' +
        '  padding: 5px 12px; font-size: 0.75rem;' +
        '  cursor: pointer; transition: all 0.2s;' +
        '  white-space: nowrap; font-family: inherit;' +
        '}' +
        '.scb-pill:hover { background: rgba(31,180,209,0.3); }' +
        '.scb-typing {' +
        '  display: none; padding: 0.5rem 1rem;' +
        '  font-size: 0.8rem; color: #b8c5d6 !important;' +
        '  font-style: italic;' +
        '}' +
        '.scb-input-area {' +
        '  padding: 0.8rem 1rem;' +
        '  border-top: 1px solid rgba(212,175,55,0.2);' +
        '  display: flex; gap: 8px;' +
        '}' +
        '.scb-input {' +
        '  flex: 1; background: rgba(255,255,255,0.08);' +
        '  border: 1px solid rgba(255,255,255,0.15);' +
        '  border-radius: 8px; padding: 8px 12px;' +
        '  color: #ffffff !important; font-size: 0.85rem;' +
        '  font-family: inherit; outline: none;' +
        '}' +
        '.scb-input::placeholder { color: #b8c5d6 !important; }' +
        '.scb-input:focus { border-color: rgba(212,175,55,0.5); }' +
        '.scb-send {' +
        '  background: #d4af37; color: #0a1628 !important;' +
        '  border: none; border-radius: 8px;' +
        '  padding: 8px 14px; cursor: pointer;' +
        '  font-weight: 600; transition: all 0.2s;' +
        '  font-family: inherit;' +
        '}' +
        '.scb-send:hover { background: #e0c050; }' +
        '.scb-send:disabled { opacity: 0.5; cursor: not-allowed; }' +
        '@media (max-width: 768px) {' +
        '  #scb-panel {' +
        '    bottom: 85px; right: 10px;' +
        '    width: calc(100vw - 20px); max-height: 60vh;' +
        '  }' +
        '  #scb-toggle { bottom: 15px; right: 15px; width: 58px; height: 58px; }' +
        '}' +
        '@media print { #scb-toggle, #scb-panel { display: none !important; } }';
    document.head.appendChild(style);

    // === INJECT GOOGLE FONTS (only if not already loaded) ===
    if (!document.querySelector('link[href*="Playfair+Display"]')) {
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap';
        document.head.appendChild(fontLink);
    }

    // === BUILD DOM ===
    // Toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'scb-toggle';
    toggleBtn.setAttribute('aria-label', 'Abrir chat asistente Scibasku');
    toggleBtn.innerHTML = '&#128172;';
    toggleBtn.onclick = function() { toggleChat(); };

    // Panel
    var panel = document.createElement('div');
    panel.id = 'scb-panel';
    panel.innerHTML = '' +
        '<div class="scb-header">' +
        '  <h3>Asistente Scibasku</h3>' +
        '  <button class="scb-close" onclick="document.getElementById(\'scb-panel\').classList.remove(\'scb-open\'); window._scbClosedByUser=true;">&times;</button>' +
        '</div>' +
        '<div class="scb-messages" id="scb-messages">' +
        '  <div class="scb-msg scb-bot">Hola! Soy Giora, de Viajes Scibasku. Somos especialistas en buceo premium, esqui y expediciones. Preguntame lo que quieras sobre estos destinos!</div>' +
        '</div>' +
        '<div class="scb-typing" id="scb-typing">Pensando...</div>' +
        '<div class="scb-pills" id="scb-pills"></div>' +
        '<div class="scb-input-area">' +
        '  <input class="scb-input" id="scb-input" type="text" placeholder="Pregunta sobre destinos, buceo, esqui..." />' +
        '  <button class="scb-send" id="scb-send">Enviar</button>' +
        '</div>';

    // Append to body when DOM is ready
    function init() {
        document.body.appendChild(toggleBtn);
        document.body.appendChild(panel);

        // Input event listeners
        document.getElementById('scb-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
        document.getElementById('scb-send').addEventListener('click', function() {
            sendMessage();
        });

        // Render initial pills
        renderPills();

        // Pulse animation for first 6 seconds
        toggleBtn.classList.add('scb-pulse');
        setTimeout(function() { toggleBtn.classList.remove('scb-pulse'); }, 6000);

        // Auto-open after delay (if user hasn't closed)
        setTimeout(function() {
            if (!window._scbClosedByUser && !chatClosedByUser) {
                var p = document.getElementById('scb-panel');
                if (p && !p.classList.contains('scb-open')) {
                    p.classList.add('scb-open');
                }
            }
        }, AUTO_OPEN_DELAY);
    }

    // === TOGGLE ===
    function toggleChat() {
        var p = document.getElementById('scb-panel');
        if (p.classList.contains('scb-open')) {
            p.classList.remove('scb-open');
            chatClosedByUser = true;
            window._scbClosedByUser = true;
        } else {
            p.classList.add('scb-open');
        }
    }

    // === PILLS ===
    function renderPills() {
        var container = document.getElementById('scb-pills');
        if (!container) return;
        container.innerHTML = '';

        var available = [];
        for (var i = 0; i < pillPool.length; i++) {
            var isUsed = false;
            for (var j = 0; j < usedPills.length; j++) {
                if (usedPills[j] === pillPool[i].text) { isUsed = true; break; }
            }
            if (!isUsed) available.push(pillPool[i]);
        }

        if (available.length === 0) {
            var hint = document.createElement('span');
            hint.className = 'scb-pill';
            hint.style.opacity = '0.6';
            hint.style.cursor = 'default';
            hint.textContent = 'Escribe tu propia pregunta';
            container.appendChild(hint);
            return;
        }

        // Shuffle available and pick VISIBLE_PILLS
        var shuffled = available.slice();
        for (var s = shuffled.length - 1; s > 0; s--) {
            var r = Math.floor(Math.random() * (s + 1));
            var tmp = shuffled[s];
            shuffled[s] = shuffled[r];
            shuffled[r] = tmp;
        }
        var show = shuffled.slice(0, VISIBLE_PILLS);

        for (var k = 0; k < show.length; k++) {
            var span = document.createElement('span');
            span.className = 'scb-pill';
            span.setAttribute('data-text', show[k].text);
            span.textContent = show[k].emoji + ' ' + show[k].text;
            span.onclick = (function(pillText, el) {
                return function() {
                    usedPills.push(pillText);
                    el.style.opacity = '0';
                    el.style.transform = 'scale(0.8)';
                    el.style.transition = 'all 0.3s ease';
                    setTimeout(function() { renderPills(); }, 300);
                    sendUserMessage(pillText);
                };
            })(show[k].text, span);
            container.appendChild(span);
        }
    }

    // === FORMAT BOT REPLY ===
    function formatBotReply(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        var safe = div.innerHTML;
        safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        safe = safe.replace(/\n/g, '<br>');
        return safe;
    }

    // === SEND MESSAGE ===
    function sendMessage() {
        var input = document.getElementById('scb-input');
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        sendUserMessage(text);
    }

    function sendUserMessage(text) {
        var messagesEl = document.getElementById('scb-messages');

        // User message
        var userDiv = document.createElement('div');
        userDiv.className = 'scb-msg scb-user';
        userDiv.textContent = text;
        messagesEl.appendChild(userDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        chatHistory.push({ role: 'user', content: text });

        document.getElementById('scb-send').disabled = true;
        document.getElementById('scb-typing').style.display = 'block';

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, CHAT_TIMEOUT);

        var payload = { messages: chatHistory };
        if (sessionId) payload.session_id = sessionId;

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        .then(function(res) {
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('Error del servidor');
            return res.json();
        })
        .then(function(data) {
            // Store session_id from first response
            if (data.session_id) sessionId = data.session_id;

            // Handle takeover mode
            if (data.takeover) {
                isTakenOver = true;
                startAdminPolling();
                // Don't show bot reply - admin is responding
                return;
            }

            // If we were in takeover and now we're not, stop polling
            if (isTakenOver && !data.takeover) {
                isTakenOver = false;
                stopAdminPolling();
            }

            var reply = data.content && data.content[0] && data.content[0].text
                ? data.content[0].text
                : 'No he podido procesar la respuesta. Contacta con Giora: +34 619 40 10 41';
            chatHistory.push({ role: 'assistant', content: reply });
            var botDiv = document.createElement('div');
            botDiv.className = 'scb-msg scb-bot';
            botDiv.innerHTML = formatBotReply(reply);
            messagesEl.appendChild(botDiv);
        })
        .catch(function(err) {
            clearTimeout(timeoutId);
            var errorDiv = document.createElement('div');
            errorDiv.className = 'scb-msg scb-error';
            if (err.name === 'AbortError') {
                errorDiv.textContent = 'La respuesta esta tardando demasiado. Intenta de nuevo o contacta con Giora: +34 619 40 10 41';
            } else {
                errorDiv.textContent = 'Vaya, algo ha fallado. Contacta con Giora: +34 619 40 10 41';
            }
            messagesEl.appendChild(errorDiv);
        })
        .finally(function() {
            document.getElementById('scb-send').disabled = false;
            document.getElementById('scb-typing').style.display = 'none';
            messagesEl.scrollTop = messagesEl.scrollHeight;
        });
    }

    // === ADMIN POLLING (when Giora takes over) ===
    function startAdminPolling() {
        if (adminPollTimer) return;
        adminPollTimer = setInterval(pollAdminMessages, ADMIN_POLL_INTERVAL);
    }

    function stopAdminPolling() {
        if (adminPollTimer) {
            clearInterval(adminPollTimer);
            adminPollTimer = null;
        }
    }

    function pollAdminMessages() {
        if (!sessionId) return;

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                poll_admin: true,
                last_admin_id: lastAdminId
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (!data.takeover) {
                isTakenOver = false;
                stopAdminPolling();
                return;
            }

            var msgs = data.admin_messages || [];
            var messagesEl = document.getElementById('scb-messages');
            for (var i = 0; i < msgs.length; i++) {
                // Skip system messages (takeover/release notifications)
                if (msgs[i].content && msgs[i].content.indexOf('---') === 0) continue;

                var adminDiv = document.createElement('div');
                adminDiv.className = 'scb-msg scb-bot';
                adminDiv.innerHTML = formatBotReply(msgs[i].content);
                messagesEl.appendChild(adminDiv);
                chatHistory.push({ role: 'assistant', content: msgs[i].content });
                lastAdminId = msgs[i].id;
            }
            if (msgs.length > 0) {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        })
        .catch(function() {}); // silent fail on poll
    }

    // === INIT ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
