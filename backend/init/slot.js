require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const ParkingLot = require("../models/ParkingLot");
const Slot = require("../models/Slot");

const MONGO_URL = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected");

  await seedSlots();
}

const seedSlots = async () => {
  await Slot.deleteMany({});

  const lots = await ParkingLot.find({});
  let slots = [];

  for (let lot of lots) {
    for (let i = 1; i <= lot.totalSlots; i++) {
      slots.push({
        parkingLot: lot._id,
        slotNumber: `S${i}`,
        floor: i <= 100 ? "G" : i <= 200 ? "1" : "2",
        type:
          i % 10 === 0
            ? "ev"
            : i % 7 === 0
            ? "handicapped"
            : i % 5 === 0
            ? "compact"
            : "standard",
        status: "available",
        currentBooking: null,
      });
    }
  }

  await Slot.insertMany(slots);
  console.log("Slots created:", slots.length);
};

main();