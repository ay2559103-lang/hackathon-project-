import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sellerRoutes from './routes/sellerRoutes.js';

import { auth, checkRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Socket.io Logic for Real-time Geolocation
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-delivery', (deliveryId) => {
    socket.join(deliveryId);
    console.log(`User joined delivery room: ${deliveryId}`);
  });

  socket.on('update-location', ({ deliveryId, location, role }) => {
    // Broadcast location to everyone in the room except the sender
    socket.to(deliveryId).emit('location-updated', { location, role });
    console.log(`Location updated for ${deliveryId} by ${role}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/sellers', auth, checkRole(['seller']), sellerRoutes);

// Protected User Profile Route
app.get('/api/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/localsell')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('LocalMarket API is running with Secure Authentication and Real-time Tracking...');
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
