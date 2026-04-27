require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const parkingRoutes = require('./routes/parking');
const bookingRoutes = require('./routes/bookings');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_URL
].filter(Boolean);

const corsOriginFn = function (origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("CORS not allowed for this origin: " + origin));
  }
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: corsOriginFn,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to each request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '🚗 Smart Parking API is running!', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('joinParkingLot', (lotId) => {
    socket.join(`lot_${lotId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Cron job: Auto-complete expired bookings every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const Booking = require('./models/Booking');
    const Slot = require('./models/Slot');
    const ParkingLot = require('./models/ParkingLot');

    const now = new Date();
    const expiredBookings = await Booking.find({
      status: { $in: ['confirmed', 'active'] },
      endTime: { $lt: now },
    });

    for (const booking of expiredBookings) {
      booking.status = 'completed';
      await booking.save();

      await Slot.findByIdAndUpdate(booking.slot, {
        status: 'available',
        currentBooking: null,
      });

      await ParkingLot.findByIdAndUpdate(booking.parkingLot, {
        $inc: { availableSlots: 1 },
      });

      io.emit('slotUpdated', {
        slotId: booking.slot,
        status: 'available',
        parkingLotId: booking.parkingLot,
      });
    }

    if (expiredBookings.length > 0) {
      console.log(`⏰ Auto-released ${expiredBookings.length} expired bookings`);
    }
  } catch (error) {
    console.error('Cron error:', error.message);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Smart Parking Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
