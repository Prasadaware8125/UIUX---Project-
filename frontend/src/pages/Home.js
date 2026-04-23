import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './Home.css';

const StatCard = ({ icon, value, label, color }) => (
  <div className="stat-card card">
    <div className="stat-card__icon" style={{ color }}>{icon}</div>
    <div className="stat-card__value" style={{ color }}>{value}</div>
    <div className="stat-card__label">{label}</div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="feature-card card">
    <div className="feature-card__icon">{icon}</div>
    <h3 className="feature-card__title">{title}</h3>
    <p className="feature-card__desc">{desc}</p>
  </div>
);

const Home = () => {
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/parking/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/parking?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home page">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__grid" />
        </div>
        <div className="container hero__content">
          <div className="hero__badge badge badge-accent animate-fadeUp">
            <span>🚀</span> Real-time parking availability
          </div>
          <h1 className="hero__title animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            Find & Book <span className="hero__title-accent">Parking</span><br />
            in Seconds
          </h1>
          <p className="hero__sub animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            No more circling blocks. Smart Parking connects you to available spots
            near you with live updates and instant booking.
          </p>

          <form className="hero__search animate-fadeUp" style={{ animationDelay: '0.3s' }} onSubmit={handleSearch}>
            <div className="hero__search-wrap">
              <span className="hero__search-icon">📍</span>
              <input
                type="text"
                placeholder="Search location or parking name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="hero__search-input"
              />
              <button type="submit" className="btn btn-primary hero__search-btn">
                Find Parking
              </button>
            </div>
          </form>

          <div className="hero__cta animate-fadeUp" style={{ animationDelay: '0.4s' }}>
            <Link to="/parking" className="btn btn-primary btn-lg">
              Browse All Lots →
            </Link>
            <Link to="/signup" className="btn btn-outline btn-lg">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="stats-section">
          <div className="container">
            <div className="grid-4 stagger">
              <StatCard icon="🏢" value={stats.totalLots} label="Parking Lots" color="var(--accent)" />
              <StatCard icon="🅿️" value={stats.totalSlots} label="Total Slots" color="var(--amber)" />
              <StatCard icon="✅" value={stats.availableSlots} label="Available Now" color="var(--green)" />
              <StatCard icon="🎟️" value={stats.totalBookings} label="Total Bookings" color="#e879f9" />
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="how-section">
        <div className="container">
          <div className="how-header">
            <h2 className="section-title font-display">How It Works</h2>
            <p className="section-sub">Book your parking spot in 3 easy steps</p>
          </div>
          <div className="how-steps">
            {[
              { num: '01', icon: '🔍', title: 'Find a Spot', desc: 'Browse available parking lots near your destination. Filter by price, location, or amenities.' },
              { num: '02', icon: '🖱️', title: 'Select & Book', desc: 'Choose your preferred slot, set your arrival and departure time, and confirm instantly.' },
              { num: '03', icon: '🚗', title: 'Park & Go', desc: 'Arrive at the lot, show your booking code, and park with complete peace of mind.' },
            ].map((step) => (
              <div key={step.num} className="how-step card">
                <div className="how-step__num">{step.num}</div>
                <div className="how-step__icon">{step.icon}</div>
                <h3 className="how-step__title">{step.title}</h3>
                <p className="how-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title font-display">Why SmartPark?</h2>
          <p className="section-sub">Everything you need for a stress-free parking experience</p>
          <div className="grid-3 stagger">
            <FeatureCard icon="⚡" title="Real-time Updates" desc="Slot status updates instantly so you always see accurate availability before you even leave home." />
            <FeatureCard icon="🔒" title="Secure Booking" desc="JWT-authenticated bookings with encrypted personal data. Your information is always safe." />
            <FeatureCard icon="💸" title="Transparent Pricing" desc="No hidden fees. See the exact cost before you book. Pay only for the time you need." />
            <FeatureCard icon="❌" title="Easy Cancellation" desc="Plans changed? Cancel any upcoming booking with one click and get a full refund." />
            <FeatureCard icon="📱" title="Mobile Friendly" desc="Fully responsive design works seamlessly on your phone, tablet, or desktop." />
            <FeatureCard icon="⏱️" title="Auto-Release" desc="Expired bookings are automatically released so slots don't stay locked unnecessarily." />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner card">
            <div className="cta-banner__orb" />
            <h2 className="cta-banner__title font-display">Ready to park smarter?</h2>
            <p className="cta-banner__sub">Join thousands of drivers who never stress about parking anymore.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/parking" className="btn btn-outline btn-lg">View Parking Lots</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__inner">
            <div className="navbar__logo" style={{ marginBottom: 8 }}>
              <span>🅿️</span>
              <span className="navbar__logo-text">Smart<span>Park</span></span>
            </div>
            <p className="text-muted text-sm">© 2024 SmartPark. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
