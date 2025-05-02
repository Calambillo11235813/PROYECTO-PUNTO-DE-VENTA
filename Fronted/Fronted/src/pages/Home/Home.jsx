// Home.jsx
import React from 'react';
import HomeHeader from '../../components/HomeHeader/HomeHeader';
import punto_venta from '../../assets/punto_de_venta.png';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <HomeHeader />
      
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Punto de Venta + Facturación Electrónica
            </h1>
            <p className="hero-subtitle">
              El sistema contable y de facturación electrónica más fácil de usar en Bolivia.<br /> 
              Emite comprobantes electrónicos requeridos desde cualquier lugar del país.
            </p>
          </div>
          <img 
            src={punto_venta} 
            alt="Sistema de facturación" 
            className="hero-image"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;