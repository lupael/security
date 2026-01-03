const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB, sequelize } = require('./database');
const db = require('./models');

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Socket.io connection
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Pass io instance to app
app.set('io', io);


// Connect to database
connectDB();

// Sync database
sequelize.sync({ force: false }).then(() => {
  console.log('Database & tables created!');
});

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.get('/api/test', async (req, res) => {
    try {
      const [results, metadata] = await db.sequelize.query("SELECT 'DB connection successful' as result");
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/scans', require('./routes/scans'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
