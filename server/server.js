const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const runRoute = require('./routes/run');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/run', runRoute);

app.get('/', (req, res) => {
    res.send('Online Code Editor API is running');
});

// Initialize WebSocket operations
initSocket(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
