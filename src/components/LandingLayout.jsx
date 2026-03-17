import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const LandingLayout = () => {
  return (
    <div className="landing-layout">
      <Navbar />
      <main className="landing-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LandingLayout;
