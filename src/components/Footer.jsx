import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Globe, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <ShieldCheck size={28} className="logo-icon" />
              <span>ummah-sync</span>
            </Link>
            <p className="footer-tagline">
              Empowering the Ummah with private, Shariah-compliant communication.
            </p>
            <div className="social-links">
              <a href="https://linkedin.com/in/saad-bin-farrukh/" target="_blank" rel="noreferrer"><Linkedin size={20} /></a>
              <a href="https://github.com/saad-bin-farrukh" target="_blank" rel="noreferrer"><Github size={20} /></a>
              <a href="https://sbf-consultancy.net" target="_blank" rel="noreferrer"><Globe size={20} /></a>
            </div>
          </div>

          <div className="footer-nav">
            <h4>Application</h4>
            <Link to="/">Home</Link>
            <Link to="/features">Features</Link>
            <Link to="/tech">Tech Stack</Link>
            <Link to="/app">Messaging App</Link>
          </div>

          <div className="footer-nav">
            <h4>Support</h4>
            <Link to="/contact">Contact Us</Link>
            <a href="https://sbf-consultancy.net" target="_blank" rel="noreferrer">SBF Consultancy</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ummah-sync. A CSR Project by <a href="https://sbf-consultancy.net" target="_blank" rel="noreferrer">SBF Consultancy</a>.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
