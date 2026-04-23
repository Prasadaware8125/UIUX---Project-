import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">🅿️</span>
          <span className="navbar__logo-text">Smart<span>Park</span></span>
        </Link>

        <div className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <Link to="/" className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}>Home</Link>
          <Link to="/parking" className={`navbar__link ${isActive('/parking') ? 'navbar__link--active' : ''}`}>Find Parking</Link>
          {user && (
            <Link to="/my-bookings" className={`navbar__link ${isActive('/my-bookings') ? 'navbar__link--active' : ''}`}>My Bookings</Link>
          )}
        </div>

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user">
              <span className="navbar__user-name">
                <span className="navbar__user-avatar">{user.name[0].toUpperCase()}</span>
                {user.name.split(' ')[0]}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>

        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
