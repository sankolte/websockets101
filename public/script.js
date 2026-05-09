const socket = io();

// Get elements (only exist on room.ejs)
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

// Generate a random username for demo purposes
const username = 'User_' + Math.floor(Math.random() * 1000);

// Only run chat logic if we are on a room page
if (form && typeof ROOM_ID !== 'undefined') {

  // ─────────────────────────────────────────────────────────────
  // CONCEPT 1: Joining a room
  // We send an object with BOTH roomId and user.
  // The server uses 'roomId' to call socket.join(roomId)
  // and stores 'user' on socket.data so it remembers who we are
  // even after this event is done (important for disconnect!).
  // ─────────────────────────────────────────────────────────────
  socket.emit('join room', { roomId: ROOM_ID, user: username });


  // ─────────────────────────────────────────────────────────────
  // CONCEPT 2: Sending a message
  // Fire-and-forget: we emit the event and don't wait for a reply.
  // ─────────────────────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msgText = input.value.trim();
    if (msgText) {
      socket.emit('chat message', {
        roomId: ROOM_ID,
        user: username,
        text: msgText
      });
      input.value = '';
    }
  });

  // Listen for incoming messages from the server
  socket.on('chat message', (data) => {
    appendMessage(data);
  });

  // Helper: Render a chat bubble
  function appendMessage(data) {
    const isSentByMe = data.user === username;

    const messageEl = document.createElement('div');
    messageEl.classList.add('message', isSentByMe ? 'sent' : 'received');

    const senderEl = document.createElement('div');
    senderEl.classList.add('message-sender');
    senderEl.textContent = isSentByMe ? 'You' : data.user;

    const bubbleEl = document.createElement('div');
    bubbleEl.classList.add('message-bubble');
    bubbleEl.textContent = data.text;

    const timeEl = document.createElement('div');
    timeEl.classList.add('message-time');
    timeEl.textContent = data.timestamp;

    messageEl.appendChild(senderEl);
    messageEl.appendChild(bubbleEl);
    messageEl.appendChild(timeEl);

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }


  // ─────────────────────────────────────────────────────────────
  // CONCEPT 3: User Join / Leave Notifications
  // The server emits these using socket.to(roomId).emit()
  // which means: broadcast to everyone EXCEPT the sender.
  // So you will never see your OWN join — only others will.
  // ─────────────────────────────────────────────────────────────
  socket.on('user joined', (user) => {
    appendSystemMessage(`${user} joined the room 👋`);
  });

  socket.on('user left', (user) => {
    appendSystemMessage(`${user} left the room`);
  });

  // Helper: Render a system-level notification (not a chat bubble)
  function appendSystemMessage(text) {
    const el = document.createElement('div');
    el.classList.add('system-message');
    el.innerHTML = `<span>${text}</span>`;
    messagesContainer.appendChild(el);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }


  // ─────────────────────────────────────────────────────────────
  // CONCEPT 4: Typing Indicator
  // Client emits 'typing' on every keystroke.
  // A timer (debounce) waits 1.5s after you stop typing,
  // then emits 'stop typing' to clean up the indicator.
  // ─────────────────────────────────────────────────────────────
  let typingTimer;
  const typingDelay = 1500;
  const typingIndicator = document.getElementById('typing-indicator');

  input.addEventListener('input', () => {
    socket.emit('typing', { roomId: ROOM_ID, user: username });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('stop typing', { roomId: ROOM_ID, user: username });
    }, typingDelay);
  });

  let typingUsers = new Set();

  function updateTypingDisplay() {
    if (typingUsers.size === 0) {
      typingIndicator.textContent = '';
    } else if (typingUsers.size === 1) {
      typingIndicator.textContent = `${Array.from(typingUsers)[0]} is typing...`;
    } else {
      typingIndicator.textContent = `${typingUsers.size} people are typing...`;
    }
  }

  socket.on('typing', (user) => {
    typingUsers.add(user);
    updateTypingDisplay();
  });

  socket.on('stop typing', (user) => {
    typingUsers.delete(user);
    updateTypingDisplay();
  });

}
