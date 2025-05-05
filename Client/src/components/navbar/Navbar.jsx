import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import './Navbar.css';
// import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [showNav, setShowNav] = useState(false);
  const [color, setColor] = useState(false);
  const location = useLocation();
  // const navigate = useNavigate();

  const changeColor = () => {
    if (window.scrollY >= 2) {
      setColor(true);
    } else {
      setColor(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', changeColor);
    return () => {
      window.removeEventListener('scroll', changeColor);
    };
  }, []);

  const closeNav = () => {
    setShowNav(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('cart');
    // navigate('/');  
  };

  // Function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={color ? 'navbar navbar-bg' : 'navbar'}>
      <div className="navbar-container">
        <div className="logo-container">
          <Link to="/" className="navbar-logo">Track<span className='logo'>Nutrition</span></Link>
        </div>
        <div className="nav-links">
          <ul className="navbar-menu">
            <li><Link to="/" className={`link ${isActive('/') ? 'active' : ''}`}>Home</Link></li>
            <li><Link to="/nutrition" className={`link ${isActive('/nutrition') ? 'active' : ''}`}>Nutrition</Link></li>
            <li><Link to="/dataset" className={`link ${isActive('/dataset') ? 'active' : ''}`}>Dataset</Link></li>
            <li><Link to="/goaltrack" className={`link ${isActive('/goaltrack') ? 'active' : ''}`}>GoalTrack</Link></li>
            <li><Link to="/indiandiet" className={`link ${isActive('/indiandiet') ? 'active' : ''}`}>IndianDiet</Link></li>
            <li><Link to="/dietplan" className={`link ${isActive('/dietplan') ? 'active' : ''}`}>DietPlan</Link></li>
          </ul>
        </div>
        <div className="nav-btn">
          <div className="profile-wrapper">
            <AccountCircleIcon />
            <Link to='/' className='link' onClick={handleLogout}>Logout</Link>
          </div>
          <FaBars className="bars" onClick={() => setShowNav(!showNav)} />
        </div>
      </div>
      <div className={showNav ? 'nav-menu show-nav' : 'nav-menu'}>
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeNav}>Home</Link>
        <Link to="/nutrition" className={`nav-link ${isActive('/nutrition') ? 'active' : ''}`} onClick={closeNav}>Nutrition</Link>
        <Link to="/dataset" className={`nav-link ${isActive('/dataset') ? 'active' : ''}`} onClick={closeNav}>Dataset</Link>
        <Link to="/goaltrack" className={`nav-link ${isActive('/goaltrack') ? 'active' : ''}`} onClick={closeNav}>GoalTrack</Link>
        <Link to="/indiandiet" className={`nav-link ${isActive('/indiandiet') ? 'active' : ''}`} onClick={closeNav}>IndianDiet</Link>
        <Link to="/dietplan" className={`nav-link ${isActive('/dietplan') ? 'active' : ''}`} onClick={closeNav}>DietPlan</Link>
        <Link to="/" className="nav-link" onClick={closeNav}>Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;