import React from 'react'
import './HeroSection.css'
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {

  const navigate = useNavigate();

  const explore = () =>{
    navigate('/nutrition');
  }

  return (
<div className='hero-banner'>
<div className="hero-banner-container">
<h2 className='hero-banner-description'>Eplore the <span className='hero-banner-span'> nutrition</span> in you food</h2>
<button className="hero-banner-btn" onClick={explore}>
  Explore
</button>
</div>
</div>
  )
}

export default HeroSection