import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Toast from './components/Toast';
import Home from './pages/Home';
import { Login, Signup } from './pages/Auth';
import ParkingList from './pages/ParkingList';
import ParkingDetail from './pages/ParkingDetail';
import MyBookings from './pages/MyBookings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/parking" element={<ParkingList />} />
          <Route path="/parking/:id" element={<ParkingDetail />} />
          <Route
            path="/my-bookings"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 80, marginBottom: 24 }}>🅿️</div>
                  <h1 className="font-display" style={{ fontSize: 32, marginBottom: 12 }}>404 — Page Not Found</h1>
                  <p className="text-muted" style={{ marginBottom: 24 }}>This page doesn't exist. Let's get you parked.</p>
                  <a href="/" className="btn btn-primary btn-lg">Go Home</a>
                </div>
              </div>
            }
          />
        </Routes>
        <Toast />
      </Router>
    </AuthProvider>
  );
}

export default App;
