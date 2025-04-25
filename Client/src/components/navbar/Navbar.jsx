import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import './Navbar.css';
// import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [showNav, setShowNav] = useState(false);
  const [color, setColor] = useState(false);
  // const navigate = useNavigate();

  const changeColor = () => {
    if (window.scrollY >= 2) {
      setColor(true);
    } else {
      setColor(false);
    }
  };

  window.addEventListener('scroll', changeColor);

  const closeNav = () => {
    setShowNav(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('userId');
    localStorage.removeItem('cart'); 
    // navigate('/');  
};

// const handleFavorite =()=>{
//   navigate('/favorites')
// }

// const handleCart = () =>{
//   navigate('/cart')
// }

  return (
    <nav className={color ? 'navbar navbar-bg' : 'navbar'}>
      <div className="navbar-container">
        <div className="logo-container">
          <Link to="/" className="navbar-logo">Track<span className='logo'>Nutrition</span></Link>
        </div>
        <div className="nav-links">
          <ul className="navbar-menu">
            <li><Link to="/" className="link">Home</Link></li>
            <li><Link to="/nutrition" className="link">Nutrition</Link></li>
           
            <li><Link to="/dataset" className="link">dataset</Link></li>
            <li><Link to="/goaltrack" className="link">goaltrack</Link></li>
            <li><Link to="/indiandiet" className="link">IndianDiet</Link></li>
            <li><Link to="/dietplan" className="link">DietPlan</Link></li>
          </ul>
        </div>
        <div className="nav-btn">
          {/* <button className="nav-fav-btn" onClick={handleFavorite}>
          <img className="nav-fav" src={liked} />
          </button> */}
        {/* <button className="nav-add-to-cart-btn" onClick={handleCart}>
        <ShoppingCartIcon/>
        </button> */}
          <div className="profile-wrapper">
            <AccountCircleIcon />
            <Link to='/' className='link' onClick={handleLogout}>Logout</Link>
          </div>
          <FaBars className="bars" onClick={() => setShowNav(!showNav)} />
        </div>
      </div>

      <div className={showNav ? 'nav-menu show-nav' : 'nav-menu'}>
        <Link to="/" className="nav-link" onClick={closeNav}>Home</Link>
        <Link to="/nutrition" className="nav-link" onClick={closeNav}>Nutrition</Link>
        <Link to="/recipe" className="nav-link" onClick={closeNav}>Recipe</Link>
        <li><Link to="/plan" className="link">Plan</Link></li>
        <Link to="/" className="nav-link" onClick={closeNav}>Logout</Link>
      </div>
    </nav>
  );
};

export default Navbar;
