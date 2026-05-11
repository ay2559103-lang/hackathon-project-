import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import sellerRoutes from './routes/sellerRoutes.js';

import { auth, checkRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  res.send('LocalMarket API is running with Secure Authentication...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
