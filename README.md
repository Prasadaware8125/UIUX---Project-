# 🅿️ SmartPark – Smart Parking System

A full-stack web app to find and book parking slots in real time.

**Stack:** React (frontend) + Node.js/Express (backend) + MongoDB Atlas

---

## ⚡ Quick Start (2 terminals)

### Step 1 — Backend

```bash
cd backend
npm install
npm run seed    # seeds 6 parking lots + slots into MongoDB
npm run dev     # starts server on http://localhost:5000
```

### Step 2 — Frontend (new terminal)

```bash
cd frontend
npm install
npm start       # opens http://localhost:3000
```

That's it. Open **http://localhost:3000** in your browser.

---

## 📱 Features

- **Sign up / Login** — JWT auth, stays logged in
- **Browse Parking Lots** — search, filter by city & price, sort
- **View Slots** — pick date & time, see which slots are free/booked
- **Book a Slot** — vehicle number, vehicle type, instant confirmation
- **My Bookings** — upcoming & past, with cancel + refund
- **Auto-release** — expired bookings free up slots every 5 min (cron job)
- **Live updates** — slot list refreshes every 30 seconds

---

## 🗂️ Project Structure

```
smart-parking/
├── backend/
│   ├── server.js          # Express + Socket.io + Cron
│   ├── config/db.js       # MongoDB connection
│   ├── models/            # User, ParkingLot, Slot, Booking
│   ├── controllers/       # Auth, Parking, Booking logic
│   ├── routes/            # /api/auth, /api/parking, /api/bookings
│   ├── middleware/auth.js # JWT protect middleware
│   ├── seed.js            # Seeds 6 Pune parking lots
│   └── .env               # MongoDB URI, JWT secret
│
└── frontend/
    ├── src/
    │   ├── App.js          # Routes
    │   ├── pages/          # Home, Auth, ParkingList, ParkingDetail, MyBookings
    │   ├── components/     # Navbar, Toast, PrivateRoute
    │   ├── context/        # AuthContext (login/signup/logout)
    │   └── utils/api.js    # Axios instance with JWT header
    └── .env                # REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🔑 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | ❌ | Register |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/parking | ❌ | List all lots |
| GET | /api/parking/stats | ❌ | Stats (lots/slots/bookings) |
| GET | /api/parking/:id | ❌ | Lot + slots |
| GET | /api/parking/:id/slots | ❌ | Slots with time availability |
| POST | /api/bookings | ✅ | Create booking |
| GET | /api/bookings/my | ✅ | My bookings |
| PUT | /api/bookings/:id/cancel | ✅ | Cancel booking |

---

## 🌱 Seed Data

6 Pune parking lots are seeded:
- Koregaon Park Plaza (₹40/hr, 30 slots)
- Shivaji Nagar Central (₹25/hr, 40 slots)
- Hinjewadi IT Park (₹20/hr, 50 slots)
- Phoenix Mall Viman Nagar (₹50/hr, 60 slots)
- Baner Road Parking Hub (₹30/hr, 35 slots)
- Kothrud Smart Parking (₹35/hr, 25 slots)

Re-run `npm run seed` anytime to reset to fresh data.
