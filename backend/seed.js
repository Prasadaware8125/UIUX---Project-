require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const ParkingLot = require('./models/ParkingLot');
const Slot = require('./models/Slot');

const parkingLotsData = [
  {
    name: 'Koregaon Park Plaza',
    address: 'North Main Road, Koregaon Park',
    city: 'Pune',
    description: 'Premium covered parking in Koregaon Park.',
    pricePerHour: 40,
    totalSlots: 30,
    availableSlots: 30,
    coordinates: { lat: 18.5362, lng: 73.8948 },
    amenities: ['CCTV', 'Security', 'EV Charging'],
  },
  {
    name: 'Shivaji Nagar Central Parking',
    address: 'FC Road, Shivaji Nagar',
    city: 'Pune',
    description: 'Central parking near offices and shops.',
    pricePerHour: 25,
    totalSlots: 40,
    availableSlots: 40,
    coordinates: { lat: 18.5314, lng: 73.8446 },
    amenities: ['CCTV', 'Lighting'],
  },
  {
    name: 'BKC Premium Parking',
    address: 'BKC, Bandra East',
    city: 'Mumbai',
    description: 'Premium business district parking.',
    pricePerHour: 60,
    totalSlots: 50,
    availableSlots: 50,
    coordinates: { lat: 19.0596, lng: 72.8656 },
    amenities: ['CCTV', 'Valet'],
  },
  {
    name: 'MG Road Metro Parking',
    address: 'MG Road',
    city: 'Bangalore',
    description: 'Metro side covered parking.',
    pricePerHour: 30,
    totalSlots: 45,
    availableSlots: 45,
    coordinates: { lat: 12.9716, lng: 77.6099 },
    amenities: ['CCTV', 'Covered'],
  }
];

const generateSlots = (parkingLotId, totalSlots, lotIndex) => {
  const slots = [];
  const floors = ['G', '1', '2'];

  for (let i = 1; i <= totalSlots; i++) {
    const floor = floors[Math.floor((i - 1) / 10)] || '2';

    let type = 'standard';
    if (i % 15 === 0) type = 'handicapped';
    else if (i % 10 === 0) type = 'ev';
    else if (i % 3 === 0) type = 'compact';

    slots.push({
      parkingLot: parkingLotId,

      // UNIQUE SLOT NUMBER FIX
      slotNumber: `LOT${lotIndex + 1}-${floor}-${String(i).padStart(2, '0')}`,

      floor,
      type,
      status: 'available'
    });
  }

  return slots;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Delete old data
    await Slot.deleteMany({});
    await ParkingLot.deleteMany({});

    // Reset indexes
    await Slot.collection.dropIndexes().catch(() => {});
    await Slot.syncIndexes();

    console.log('🗑️ Old data cleared');

    const lots = await ParkingLot.insertMany(parkingLotsData);
    console.log(`✅ Created ${lots.length} parking lots`);

    let allSlots = [];

    lots.forEach((lot, index) => {
      const slots = generateSlots(lot._id, lot.totalSlots, index);
      allSlots.push(...slots);
    });

    await Slot.insertMany(allSlots);

    console.log(`✅ Created ${allSlots.length} slots`);
    console.log('🎉 Database Seeded Successfully');

    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
};

seedDatabase();