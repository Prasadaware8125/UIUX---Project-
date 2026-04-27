require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const ParkingLot = require("../models/ParkingLot.js");

const MONGO_URL = process.env.MONGO_URI;

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to database.");

        await initDB();

        console.log("Done.");
        process.exit(0); // clean exit
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

const initDB = async () => {
    await ParkingLot.deleteMany({});
    await ParkingLot.insertMany(initData.data);
    console.log("data was initialized!");
};

main();