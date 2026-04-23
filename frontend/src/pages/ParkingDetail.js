import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import API from '../utils/api';
import { io } from 'socket.io-client';
import './ParkingDetail.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SlotGrid = ({ slots, selected, onSelect }) => {
  const typeIcon = { standard: '🚗', compact: '🏎️', handicapped: '♿', ev: '⚡' };

  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const available = slot.isAvailableForTime ?? slot.status === 'available';
        const isSelected = selected?._id === slot._id;

        return (
          <button
            key={slot._id}
            className={`slot-btn ${!available ? 'slot-btn--booked' : ''} ${isSelected ? 'slot-btn--selected' : ''}`}
            onClick={() => available && onSelect(slot)}
            disabled={!available}
            title={`Slot ${slot.slotNumber} (${slot.type})`}
          >
            <span className="slot-btn__icon">{typeIcon[slot.type] || '🚗'}</span>
            <span className="slot-btn__num">{slot.slotNumber}</span>
            <span className="slot-btn__type">{slot.type}</span>
          </button>
        );
      })}
    </div>
  );
};

const ParkingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState({
    date: '',
    startTime: '',
    endTime: '',
    vehicleNumber: '',
    vehicleType: 'car',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [step, setStep] = useState(1); // 1: Select slot, 2: Details, 3: Confirm

  const fetchLot = useCallback(async () => {
    try {
      const res = await API.get(`/parking/${id}`);
      setLot(res.data.data.lot);
      setSlots(res.data.data.slots);
    } catch {
      showToast('Failed to load parking lot', 'error');
      navigate('/parking');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchLot(); }, [fetchLot]);

  // Real-time slot updates via socket.io
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('joinParkingLot', id);
    socket.on('slotUpdated', ({ parkingLotId }) => {
      if (parkingLotId === id || parkingLotId?.toString() === id) {
        fetchLot();
      }
    });
    return () => socket.disconnect();
  }, [id, fetchLot]);

  const fetchSlotsForTime = useCallback(async () => {
    if (!booking.date || !booking.startTime || !booking.endTime) return;
    try {
      const params = new URLSearchParams({
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      const res = await API.get(`/parking/${id}/slots?${params}`);
      setSlots(res.data.data);
      setSelectedSlot(null);
    } catch {}
  }, [id, booking.date, booking.startTime, booking.endTime]);

  useEffect(() => { fetchSlotsForTime(); }, [fetchSlotsForTime]);

  const handleBookingChange = (e) => {
    setBooking((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setBookingError('');
  };

  const getDuration = () => {
    if (!booking.date || !booking.startTime || !booking.endTime) return 0;
    const start = new Date(`${booking.date}T${booking.startTime}`);
    const end = new Date(`${booking.date}T${booking.endTime}`);
    return Math.max(0, Math.ceil((end - start) / 3600000));
  };

  const totalCost = getDuration() * (lot?.pricePerHour || 0);

  const handleBook = async () => {
    if (!user) {
      showToast('Please login to book', 'error');
      return navigate('/login', { state: { from: `/parking/${id}` } });
    }

    if (!selectedSlot) return setBookingError('Please select a slot.');
    if (!booking.date) return setBookingError('Please select a date.');
    if (!booking.startTime || !booking.endTime) return setBookingError('Please set start and end time.');

    const duration = getDuration();
    if (duration <= 0) return setBookingError('End time must be after start time.');
    if (!booking.vehicleNumber) return setBookingError('Please enter your vehicle number.');

    setBookingLoading(true);
    setBookingError('');

    try {
      const payload = {
        parkingLotId: id,
        slotId: selectedSlot._id,
        startTime: new Date(`${booking.date}T${booking.startTime}`).toISOString(),
        endTime: new Date(`${booking.date}T${booking.endTime}`).toISOString(),
        vehicleNumber: booking.vehicleNumber,
        vehicleType: booking.vehicleType,
      };

      const res = await API.post('/bookings', payload);
      showToast(`Booking confirmed! Code: ${res.data.data.bookingCode} 🎉`, 'success');
      navigate('/my-bookings');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
          <p className="text-muted">Loading parking lot…</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const available = slots.filter((s) => (s.isAvailableForTime ?? s.status === 'available')).length;
  const booked = slots.length - available;

  return (
    <div className="parking-detail page">
      <div className="container">
        <Link to="/parking" className="back-link">← Back to listings</Link>

        {/* Lot Info */}
        <div className="lot-header animate-fadeUp">
          <div className="lot-header__left">
            <div className="lot-icon">🏢</div>
            <div>
              <h1 className="lot-name font-display">{lot.name}</h1>
              <p className="lot-address">📍 {lot.address}, {lot.city}</p>
              {lot.description && <p className="lot-desc">{lot.description}</p>}
            </div>
          </div>
          <div className="lot-header__right">
            <div className="lot-price">
              <span className="lot-price__val">₹{lot.pricePerHour}</span>
              <span className="lot-price__label">per hour</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="lot-stats animate-fadeUp">
          <div className="lot-stat">
            <span className="lot-stat__val text-green">{available}</span>
            <span className="lot-stat__label">Available Slots</span>
          </div>
          <div className="lot-stat">
            <span className="lot-stat__val text-red">{booked}</span>
            <span className="lot-stat__label">Booked Slots</span>
          </div>
          <div className="lot-stat">
            <span className="lot-stat__val">{lot.totalSlots}</span>
            <span className="lot-stat__label">Total Slots</span>
          </div>
          {lot.amenities?.length > 0 && (
            <div className="lot-amenities">
              {lot.amenities.map((a) => <span key={a} className="tag">{a}</span>)}
            </div>
          )}
        </div>


        {/* Mini Map */}
        {lot.coordinates && (
          <div className="lot-minimap animate-fadeUp">
            <MapContainer
              center={[lot.coordinates.lat, lot.coordinates.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='© OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lot.coordinates.lat, lot.coordinates.lng]}>
                <Popup>{lot.name}</Popup>
              </Marker>
            </MapContainer>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lot.coordinates.lat},${lot.coordinates.lng}`}
              target="_blank"
              rel="noreferrer"
              className="get-directions-btn"
            >
              📍 Get Directions on Google Maps
            </a>
          </div>
        )}

        <div className="detail-layout">
          {/* Slot Selection */}
          <div className="detail-main">
            <div className="card detail-card animate-fadeUp">
              <h2 className="detail-card__title font-display">Select Time & Slot</h2>

              {/* Time Picker */}
              <div className="time-picker">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-input"
                    value={booking.date}
                    min={todayStr}
                    onChange={handleBookingChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    className="form-input"
                    value={booking.startTime}
                    onChange={handleBookingChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    className="form-input"
                    value={booking.endTime}
                    onChange={handleBookingChange}
                  />
                </div>
              </div>

              {booking.date && booking.startTime && booking.endTime && (
                <div className="time-summary">
                  ⏱ Duration: <strong>{getDuration()} hr{getDuration() !== 1 ? 's' : ''}</strong>
                  &nbsp;·&nbsp; Estimated: <strong className="text-accent">₹{totalCost}</strong>
                </div>
              )}

              {/* Legend */}
              <div className="slot-legend">
                <span><span className="legend-dot" style={{ background: 'var(--green)' }} /> Available</span>
                <span><span className="legend-dot" style={{ background: 'var(--red)' }} /> Booked</span>
                <span><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Selected</span>
              </div>

              {/* Slot Grid */}
              {slots.length === 0
                ? <div className="empty-state"><div className="empty-icon">🅿️</div><h3>No slots found</h3></div>
                : <SlotGrid slots={slots} selected={selectedSlot} onSelect={setSelectedSlot} />}
            </div>
          </div>

          {/* Booking Panel */}
          <div className="detail-sidebar">
            <div className="booking-panel card animate-fadeUp">
              <h2 className="booking-panel__title font-display">Book This Lot</h2>

              {selectedSlot ? (
                <div className="selected-slot">
                  <span>✅ Slot selected:</span>
                  <strong>{selectedSlot.slotNumber}</strong>
                  <span className="badge badge-accent">{selectedSlot.type}</span>
                </div>
              ) : (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  👆 Select a slot from the grid on the left
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  className="form-input"
                  placeholder="MH12AB1234"
                  value={booking.vehicleNumber}
                  onChange={handleBookingChange}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  name="vehicleType"
                  className="form-input"
                  value={booking.vehicleType}
                  onChange={handleBookingChange}
                >
                  <option value="car">🚗 Car</option>
                  <option value="bike">🏍️ Bike</option>
                  <option value="suv">🚙 SUV</option>
                  <option value="truck">🚚 Truck</option>
                </select>
              </div>

              {bookingError && <div className="alert alert-error">{bookingError}</div>}

              {/* Summary */}
              {selectedSlot && getDuration() > 0 && (
                <div className="booking-summary">
                  <div className="booking-summary__row">
                    <span>Slot</span><strong>{selectedSlot.slotNumber}</strong>
                  </div>
                  <div className="booking-summary__row">
                    <span>Duration</span><strong>{getDuration()} hr{getDuration() !== 1 ? 's' : ''}</strong>
                  </div>
                  <div className="booking-summary__row">
                    <span>Rate</span><strong>₹{lot.pricePerHour}/hr</strong>
                  </div>
                  <div className="divider" style={{ margin: '12px 0' }} />
                  <div className="booking-summary__row booking-summary__total">
                    <span>Total</span><strong className="text-accent">₹{totalCost}</strong>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleBook}
                disabled={bookingLoading || !selectedSlot}
              >
                {bookingLoading
                  ? <><span className="spinner" /> Booking…</>
                  : user
                  ? 'Confirm Booking →'
                  : 'Login to Book →'}
              </button>

              {!user && (
                <p className="text-muted text-sm mt-1" style={{ textAlign: 'center' }}>
                  <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link> or <Link to="/signup" style={{ color: 'var(--accent)' }}>Sign up</Link> to book
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingDetail;
