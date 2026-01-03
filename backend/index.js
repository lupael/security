const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./models');
const scansRouter = require('./routes/scans');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Configure this appropriately for production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Make io available in routes/controllers
app.set('socketio', io);

// Routes
app.use('/api/scans', scansRouter);

app.get('/', (req, res) => {
  res.send('Security Checker API is running');
});

// Start server
db.sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});