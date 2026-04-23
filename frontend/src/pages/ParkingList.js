import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../utils/api';
import './ParkingList.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (available, isFull) => L.divIcon({
  className: '',
  html: `<div style="
    background:${isFull ? '#ef4444' : available <= 5 ? '#f59e0b' : '#22c55e'};
    color:#fff;font-weight:700;font-size:11px;
    padding:4px 8px;border-radius:20px;
    border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    white-space:nowrap;
  ">${isFull ? 'Full' : available + ' free'}</div>`,
  iconAnchor: [30, 14],
});

// Fly map to new bounds when city changes
function MapController({ lots }) {
  const map = useMap();
  useEffect(() => {
    if (lots.length === 0) return;
    const bounds = L.latLngBounds(lots.map(l => [l.coordinates.lat, l.coordinates.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [lots, map]);
  return null;
}

const cityCenter = {
  Pune:      { lat: 18.5204, lng: 73.8567 },
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
};

// ── Parking Card ───────────────────────────────────────────────
const ParkingCard = ({ lot, onHover, isHighlighted }) => {
  const occupancy = ((lot.totalSlots - lot.availableSlots) / lot.totalSlots) * 100;
  const isAlmostFull = lot.availableSlots <= 5 && lot.availableSlots > 0;
  const isFull = lot.availableSlots === 0;

  return (
    <div
      className={`parking-card card animate-fadeUp ${isHighlighted ? 'parking-card--highlight' : ''}`}
      onMouseEnter={() => onHover && onHover(lot._id)}
      onMouseLeave={() => onHover && onHover(null)}
    >
      <div className="parking-card__header">
        <div className="parking-card__icon">🏢</div>
        <div>
          {isFull
            ? <span className="badge badge-red">● Full</span>
            : isAlmostFull
            ? <span className="badge badge-amber">● Almost Full</span>
            : <span className="badge badge-green">● Available</span>}
        </div>
      </div>

      <h3 className="parking-card__name">{lot.name}</h3>
      <p className="parking-card__address">📍 {lot.address}, {lot.city}</p>
      {lot.description && <p className="parking-card__desc">{lot.description}</p>}

      <div className="parking-card__stats">
        <div className="parking-card__stat">
          <span className="parking-card__stat-val text-green">{lot.availableSlots}</span>
          <span className="parking-card__stat-label">Available</span>
        </div>
        <div className="parking-card__stat-divider" />
        <div className="parking-card__stat">
          <span className="parking-card__stat-val">{lot.totalSlots}</span>
          <span className="parking-card__stat-label">Total</span>
        </div>
        <div className="parking-card__stat-divider" />
        <div className="parking-card__stat">
          <span className="parking-card__stat-val text-accent">₹{lot.pricePerHour}</span>
          <span className="parking-card__stat-label">/ hour</span>
        </div>
      </div>

      <div className="parking-card__bar">
        <div className="parking-card__bar-fill" style={{
          width: `${occupancy}%`,
          background: isFull ? 'var(--red)' : isAlmostFull ? 'var(--amber)' : 'var(--green)',
        }} />
      </div>
      <p className="parking-card__bar-label text-muted text-xs">{Math.round(occupancy)}% occupied</p>

      {lot.amenities?.length > 0 && (
        <div className="parking-card__amenities">
          {lot.amenities.slice(0, 4).map(a => <span key={a} className="tag">{a}</span>)}
        </div>
      )}

      <Link
        to={`/parking/${lot._id}`}
        className={`btn btn-primary w-full mt-2 ${isFull ? 'btn-disabled' : ''}`}
        style={isFull ? { pointerEvents: 'none', opacity: 0.5 } : {}}
      >
        {isFull ? 'Lot Full' : 'View & Book →'}
      </Link>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="parking-card card">
    <div className="skeleton" style={{ height: 60, marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 20, marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 20 }} />
    <div className="skeleton" style={{ height: 50, marginBottom: 16 }} />
    <div className="skeleton" style={{ height: 36 }} />
  </div>
);

// ── Main Page ───────────────────────────────────────────────────
const ParkingList = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // 'list' | 'map' | 'split'
  const [hoveredLot, setHoveredLot] = useState(null);
  const [searchParams] = useSearchParams();
  const debounceRef = useRef(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: '',
    maxPrice: '',
    sortBy: 'available',
  });

  const fetchLots = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set('search', f.search);
      if (f.city) params.set('city', f.city);
      if (f.maxPrice) params.set('maxPrice', f.maxPrice);
      const res = await API.get(`/parking?${params}`);
      let data = res.data.data || [];
      if (f.sortBy === 'available') data = [...data].sort((a, b) => b.availableSlots - a.availableSlots);
      if (f.sortBy === 'price_asc') data = [...data].sort((a, b) => a.pricePerHour - b.pricePerHour);
      if (f.sortBy === 'price_desc') data = [...data].sort((a, b) => b.pricePerHour - a.pricePerHour);
      setLots(data);
    } catch (err) {
      console.error(err);
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLots(filters); }, []); // eslint-disable-line

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => fetchLots(filters), 30000);
    return () => clearInterval(t);
  }, [filters, fetchLots]);

  const handleFilterChange = (key, val) => {
    const nf = { ...filters, [key]: val };
    setFilters(nf);
    if (key === 'search') {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchLots(nf), 400);
    } else {
      fetchLots(nf);
    }
  };

  const handleReset = () => {
    const reset = { search: '', city: '', maxPrice: '', sortBy: 'available' };
    setFilters(reset);
    fetchLots(reset);
  };

  const hasActiveFilters = filters.search || filters.city || filters.maxPrice;

  // Map center — use selected city or first lot or default India
  const mapCenter = filters.city && cityCenter[filters.city]
    ? [cityCenter[filters.city].lat, cityCenter[filters.city].lng]
    : lots.length > 0
    ? [lots[0].coordinates.lat, lots[0].coordinates.lng]
    : [20.5937, 78.9629];

  return (
    <div className="parking-list page">
      <div className="container">
        {/* Header */}
        <div className="parking-list__header animate-fadeUp">
          <div>
            <h1 className="section-title font-display">Find Parking</h1>
            <p className="section-sub">
              {loading ? 'Loading lots…' : `${lots.length} parking lot${lots.length !== 1 ? 's' : ''} found`}
              <span className="live-dot"> ● Live</span>
            </p>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              ☰ List
            </button>
            <button className={`view-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}>
              ⊞ Split
            </button>
            <button className={`view-btn ${viewMode === 'map' ? 'active' : ''}`} onClick={() => setViewMode('map')}>
              🗺 Map
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters card animate-fadeUp">
          <form onSubmit={(e) => { e.preventDefault(); clearTimeout(debounceRef.current); fetchLots(filters); }} className="filters__inner">
            <div className="filters__search">
              <span className="filters__search-icon">🔍</span>
              <input
                type="text"
                className="filters__search-input"
                placeholder="Search by name, area or city…"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              {filters.search && (
                <button type="button" onClick={() => handleFilterChange('search', '')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
              )}
            </div>

            <select className="form-input filters__select" value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}>
              <option value="">All Cities</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
            </select>

            <select className="form-input filters__select" value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}>
              <option value="">Any Price</option>
              <option value="20">Up to ₹20/hr</option>
              <option value="30">Up to ₹30/hr</option>
              <option value="50">Up to ₹50/hr</option>
            </select>

            <select className="form-input filters__select" value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
              <option value="available">Most Available</option>
              <option value="price_asc">Price: Low–High</option>
              <option value="price_desc">Price: High–Low</option>
            </select>

            <button type="submit" className="btn btn-primary">Search</button>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline" onClick={handleReset}>Clear</button>
            )}
          </form>
        </div>

        {/* Content Area */}
        <div className={`content-area content-area--${viewMode}`}>

          {/* List Panel */}
          {viewMode !== 'map' && (
            <div className="list-panel">
              <div className="parking-grid stagger">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                  : lots.length === 0
                  ? (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <div className="empty-icon">🔍</div>
                      <h3>No parking lots found</h3>
                      <p style={{ marginBottom: 20 }}>
                        {hasActiveFilters ? 'Try clearing your filters.' : 'No lots available.'}
                      </p>
                      {hasActiveFilters && (
                        <button className="btn btn-primary" onClick={handleReset}>Clear Filters</button>
                      )}
                    </div>
                  )
                  : lots.map(lot => (
                    <ParkingCard
                      key={lot._id}
                      lot={lot}
                      onHover={setHoveredLot}
                      isHighlighted={hoveredLot === lot._id}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Map Panel */}
          {viewMode !== 'list' && (
            <div className="map-panel">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%', borderRadius: 12 }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {lots.map(lot => (
                  <Marker
                    key={lot._id}
                    position={[lot.coordinates.lat, lot.coordinates.lng]}
                    icon={makeIcon(lot.availableSlots, lot.availableSlots === 0)}
                  >
                    <Popup maxWidth={240}>
                      <div style={{ fontFamily: 'sans-serif', padding: '4px 0' }}>
                        <strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>{lot.name}</strong>
                        <p style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>📍 {lot.address}</p>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                          <span style={{ fontSize: 12 }}>
                            <b style={{ color: '#22c55e' }}>{lot.availableSlots}</b> free / {lot.totalSlots} total
                          </span>
                          <span style={{ fontSize: 12 }}>
                            <b style={{ color: '#6c63ff' }}>₹{lot.pricePerHour}</b>/hr
                          </span>
                        </div>
                        <a
                          href={`/parking/${lot._id}`}
                          style={{
                            display: 'block', textAlign: 'center',
                            background: lot.availableSlots === 0 ? '#ccc' : '#6c63ff',
                            color: '#fff', padding: '6px 12px', borderRadius: 6,
                            textDecoration: 'none', fontSize: 13, fontWeight: 600,
                            pointerEvents: lot.availableSlots === 0 ? 'none' : 'auto',
                          }}
                        >
                          {lot.availableSlots === 0 ? 'Full' : 'View & Book →'}
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                {lots.length > 0 && <MapController lots={lots} />}
              </MapContainer>
              {lots.length > 0 && (
                <div className="map-legend">
                  <span><span style={{ background: '#22c55e' }} className="map-dot" /> Available</span>
                  <span><span style={{ background: '#f59e0b' }} className="map-dot" /> Almost Full</span>
                  <span><span style={{ background: '#ef4444' }} className="map-dot" /> Full</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParkingList;
