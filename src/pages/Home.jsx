import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Lock, Globe, Sparkles } from 'lucide-react';

const Home = () => {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Private Communal Messaging <br />
              <span>Tailored for the Ummah</span>
            </h1>
            <p className="hero-subtitle">
              Secure, ethical, and Shariah-compliant communication platform designed to empower communities and organizations.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="btn-primary">Launch ummah-sync</Link>
              <Link to="/features" className="btn-secondary">Explore Features</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="app-mockup">
              <img src="/logo.png" alt="ummah-sync Mockup" />
              <div className="floating-bubble b1"><Sparkles size={16} /> AI suggestions</div>
              <div className="floating-bubble b2"><Lock size={16} /> E2E Encrypted</div>
              <div className="floating-bubble b3"><ShieldCheck size={16} /> Shariah Ready</div>
            </div>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Mission</span>
            <h2>Why ummah-sync?</h2>
            <p>We built ummah-sync to bridge the gap between modern communication needs and Islamic values.</p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="card-icon"><Lock size={24} /></div>
              <h3>Privacy First</h3>
              <p>End-to-end encrypted messaging ensuring your communal discussions stay private.</p>
            </div>
            <div className="feature-card">
              <div className="card-icon"><ShieldCheck size={24} /></div>
              <h3>Ethical AI</h3>
              <p>Integrated AI to help translate, refine, and ensure professional communication.</p>
            </div>
            <div className="feature-card">
              <div className="card-icon"><Globe size={24} /></div>
              <h3>Global Reach</h3>
              <p>Connecting teams and communities across the globe with high-performance signaling.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to transform your community's communication?</h2>
            <p>Join ummah-sync today or contact SBF Consultancy for a custom white-label solution.</p>
            <div className="cta-btns">
              <Link to="/app" className="btn-light">Open App</Link>
              <Link to="/contact" className="btn-outline">Contact SBF</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
