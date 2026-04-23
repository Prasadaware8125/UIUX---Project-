import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { showToast } from '../components/Toast';
import './MyBookings.css';

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'badge-accent', icon: '✅' },
  active:    { label: 'Active',     color: 'badge-green', icon: '🟢' },
  completed: { label: 'Completed',  color: 'badge-amber', icon: '🏁' },
  cancelled: { label: 'Cancelled',  color: 'badge-red',   icon: '❌' },
};

const BookingCard = ({ booking, onCancel }) => {
  const cfg = statusConfig[booking.status] || statusConfig.confirmed;
  const start = new Date(booking.startTime);
  const end   = new Date(booking.endTime);
  const canCancel = ['confirmed', 'active'].includes(booking.status);

  return (
    <div className="booking-card card animate-fadeUp">
      <div className="booking-card__header">
        <div className="booking-card__code">
          <span className="booking-card__code-label">Booking Code</span>
          <span className="booking-card__code-val">{booking.bookingCode}</span>
        </div>
        <span className={`badge ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
      </div>

      <div className="booking-card__body">
        <div className="booking-card__info">
          <div className="booking-card__lot">
            <span className="booking-card__lot-icon">🏢</span>
            <div>
              <p className="booking-card__lot-name">{booking.parkingLot?.name}</p>
              <p className="booking-card__lot-addr text-muted text-sm">
                📍 {booking.parkingLot?.address}, {booking.parkingLot?.city}
              </p>
            </div>
          </div>

          <div className="booking-card__meta">
            <div className="booking-card__meta-item">
              <span className="booking-card__meta-icon">🅿️</span>
              <div>
                <span className="booking-card__meta-label">Slot</span>
                <span className="booking-card__meta-val">
                  {booking.slot?.slotNumber} ({booking.slot?.type})
                </span>
              </div>
            </div>
            <div className="booking-card__meta-item">
              <span className="booking-card__meta-icon">🚗</span>
              <div>
                <span className="booking-card__meta-label">Vehicle</span>
                <span className="booking-card__meta-val">{booking.vehicleNumber}</span>
              </div>
            </div>
            <div className="booking-card__meta-item">
              <span className="booking-card__meta-icon">📅</span>
              <div>
                <span className="booking-card__meta-label">Date</span>
                <span className="booking-card__meta-val">
                  {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="booking-card__meta-item">
              <span className="booking-card__meta-icon">⏱</span>
              <div>
                <span className="booking-card__meta-label">Time</span>
                <span className="booking-card__meta-val">
                  {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} →{' '}
                  {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-card__right">
          <div className="booking-card__amount">
            <span className="booking-card__amount-val">₹{booking.totalAmount}</span>
            <span className="booking-card__amount-label">
              {booking.duration} hr{booking.duration !== 1 ? 's' : ''}
            </span>
          </div>
          {canCancel && (
            <button className="btn btn-danger btn-sm" onClick={() => onCancel(booking._id)}>
              Cancel
            </button>
          )}
          {booking.status === 'cancelled' && (
            <span className="text-muted text-xs">Refund processed</span>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonBooking = () => (
  <div className="card" style={{ padding: 24, marginBottom: 16 }}>
    <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 40 }} />
  </div>
);

const EmptyState = ({ tab }) => (
  <div className="empty-state">
    <div className="empty-icon">{tab === 'upcoming' ? '📅' : '📜'}</div>
    <h3>
      {tab === 'upcoming' ? 'No upcoming bookings yet' : 'No past bookings'}
    </h3>
    <p style={{ marginBottom: 28, maxWidth: 320, margin: '8px auto 28px' }}>
      {tab === 'upcoming'
        ? 'You have no active or confirmed bookings. Find a parking lot and book your first slot!'
        : 'Your completed and cancelled bookings will appear here.'}
    </p>
    {tab === 'upcoming' && (
      <Link to="/parking" className="btn btn-primary btn-lg">
        🔍 Find Parking Now
      </Link>
    )}
  </div>
);

const MyBookings = () => {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('upcoming');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelling, setCancelling]   = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/bookings/my');
      setBookings(res.data.data || []);
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      await API.put(`/bookings/${id}/cancel`);
      showToast('Booking cancelled. Refund will be processed.', 'success');
      setCancelConfirm(null);
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cancel failed', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => ['confirmed', 'active'].includes(b.status) && new Date(b.endTime) >= now
  );
  const past = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || new Date(b.endTime) < now
  );

  const displayed = tab === 'upcoming' ? upcoming : past;

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="my-bookings page">
      <div className="container">
        {/* Header */}
        <div className="my-bookings__header animate-fadeUp">
          <div>
            <h1 className="section-title font-display">My Bookings</h1>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              {loading ? 'Loading…' : `${bookings.length} total booking${bookings.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {bookings.length > 0 && (
            <div className="my-bookings__stats">
              <div className="my-stat">
                <span className="my-stat__val text-green">{upcoming.length}</span>
                <span className="my-stat__label">Upcoming</span>
              </div>
              <div className="my-stat">
                <span className="my-stat__val text-accent">₹{totalSpent}</span>
                <span className="my-stat__label">Total Spent</span>
              </div>
            </div>
          )}
        </div>

        {/* If no bookings at all — show big CTA */}
        {!loading && bookings.length === 0 ? (
          <div className="card" style={{ padding: '60px 40px', textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🅿️</div>
            <h2 className="font-display" style={{ fontSize: 24, marginBottom: 10 }}>
              No bookings yet!
            </h2>
            <p className="text-muted" style={{ marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
              You haven't booked any parking slot yet. Find a lot near you and book your first spot in seconds.
            </p>
            <Link to="/parking" className="btn btn-primary btn-lg">
              🔍 Find & Book Parking
            </Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="bookings-tabs animate-fadeUp">
              <button
                className={`tab-btn ${tab === 'upcoming' ? 'tab-btn--active' : ''}`}
                onClick={() => setTab('upcoming')}
              >
                Upcoming
                {upcoming.length > 0 && <span className="tab-count">{upcoming.length}</span>}
              </button>
              <button
                className={`tab-btn ${tab === 'past' ? 'tab-btn--active' : ''}`}
                onClick={() => setTab('past')}
              >
                Past & Cancelled
                {past.length > 0 && <span className="tab-count">{past.length}</span>}
              </button>
            </div>

            {/* List */}
            <div className="bookings-list stagger">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonBooking key={i} />)
                : displayed.length === 0
                ? <EmptyState tab={tab} />
                : displayed.map((b) => (
                    <BookingCard
                      key={b._id}
                      booking={b}
                      onCancel={(id) => setCancelConfirm(id)}
                    />
                  ))}
            </div>
          </>
        )}

        {/* Cancel Confirm Modal */}
        {cancelConfirm && (
          <div className="modal-overlay" onClick={() => setCancelConfirm(null)}>
            <div className="modal card animate-fadeUp" onClick={(e) => e.stopPropagation()}>
              <div className="modal__icon">⚠️</div>
              <h2 className="modal__title font-display">Cancel Booking?</h2>
              <p className="modal__sub">
                This action cannot be undone. The slot will be released and you'll receive a full refund.
              </p>
              <div className="modal__actions">
                <button className="btn btn-outline" onClick={() => setCancelConfirm(null)}>
                  Keep Booking
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleCancel(cancelConfirm)}
                  disabled={cancelling}
                >
                  {cancelling ? <><span className="spinner" /> Cancelling…</> : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
