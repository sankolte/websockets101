const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const methodOverride = require('method-override');

const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// App configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// In-memory data store for chat rooms
let rooms = [
  { id: '1', name: 'General Chat' },
  { id: '2', name: 'Random' }
];

// Generate a simple unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- CRUD Routes for Rooms ---

// READ: List all rooms
app.get('/', (req, res) => {
  res.render('index', { rooms });
});

// CREATE: Add a new room
app.post('/rooms', (req, res) => {
  const { name } = req.body;
  if (name && name.trim()) {
    rooms.push({ id: generateId(), name: name.trim() });
  }
  res.redirect('/');
});

// READ (Single): Show specific room chat interface
app.get('/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).send('Room not found');
  res.render('room', { room });
});

// UPDATE: Show form to edit a room
app.get('/rooms/:id/edit', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).send('Room not found');
  res.render('edit', { room });
});

// UPDATE: Apply the edit
app.put('/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (room && req.body.name && req.body.name.trim()) {
    room.name = req.body.name.trim();
  }
  res.redirect('/');
});

// DELETE: Remove a room
app.delete('/rooms/:id', (req, res) => {
  rooms = rooms.filter(r => r.id !== req.params.id);
  res.redirect('/');
});

// --- Socket.IO Setup ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins a specific room
  // We now receive both roomId AND username from the client
  socket.on('join room', (data) => {
    const { roomId, user } = data;

    // socket.join() is the core Socket.IO method that
    // adds this specific connection into a named "channel".
    // From now on, io.to(roomId).emit() will reach this socket.
    socket.join(roomId);

    // socket.data is a plain object that lives on the socket.
    // We store the user info here so we can access it later
    // when the user disconnects (we won't have access to 'data' then).
    socket.data.username = user;
    socket.data.roomId = roomId;

    console.log(`${user} joined room ${roomId}`);

    // Notify ONLY OTHER people in the room — not the sender.
    // socket.to(room) = everyone in the room EXCEPT this socket.
    socket.to(roomId).emit('user joined', user);
  });

  // Handle incoming messages for a specific room
  socket.on('chat message', (data) => {
    io.to(data.roomId).emit('chat message', {
      user: data.user,
      text: data.text,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('typing', data.user);
  });

  socket.on('stop typing', (data) => {
    socket.to(data.roomId).emit('stop typing', data.user);
  });

  socket.on('disconnect', () => {
    // socket.data still has the info we saved during 'join room'!
    // This is why we stored it — disconnect has no event data.
    const { username, roomId } = socket.data;
    if (username && roomId) {
      console.log(`${username} left room ${roomId}`);
      // Tell everyone else in the room this person left.
      socket.to(roomId).emit('user left', username);
    }
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
