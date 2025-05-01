import React from 'react';
import punto_de_venta from '../assets/img/punto_de_venta.png';

const Home = () => {
  return (
    <div className="px-8 min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-100 to-gray-200 mt-8">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto px-8 gap-16">
          {/* Hero Text */}
          <div className="flex-1 text-left">
            <h1 className="text-4xl font-bold text-green-600 mb-6 leading-tight">
              Punto de Venta + Facturación Electrónica
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed max-w-md">
              El sistema contable y de facturación electrónica más fácil de usar en Bolivia.<br />
              Emite comprobantes electrónicos requeridos desde cualquier lugar del país.
            </p>
          </div>

          {/* Hero Image */}
          <img 
            src={punto_de_venta } 
            alt="Sistema de facturación electrónica" 
            className="w-full max-w-sm rounded-lg shadow-lg"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
