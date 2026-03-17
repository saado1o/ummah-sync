import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Mail, Phone, MapPin, Globe, Send, ShieldCheck } from 'lucide-react';

const Contact = () => {
  const [state, handleSubmit] = useForm("xjgapbez");

  return (
    <div className="landing-page">
      <section className="contact-section">
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-info-panel">
              <span className="section-label">Get in Touch</span>
              <h1>Contact <br /> SBF Consultancy</h1>
              <p>
                Interested in a custom white-label communication solution for your organization? 
                Reach out to us for a tailored demo and strategy.
              </p>

              <div className="contact-details">
                <div className="detail-item">
                  <Mail className="detail-icon" />
                  <div>
                    <h4>Email</h4>
                    <p>saad@sbf-consultancy.net</p>
                  </div>
                </div>
                <div className="detail-item">
                  <Phone className="detail-icon" />
                  <div>
                    <h4>Phone</h4>
                    <p>+92-345-3204802</p>
                  </div>
                </div>
                <div className="detail-item">
                  <MapPin className="detail-icon" />
                  <div>
                    <h4>Location</h4>
                    <p>Karachi, Sindh, Pakistan</p>
                  </div>
                </div>
                <div className="detail-item">
                  <Globe className="detail-icon" />
                  <div>
                    <h4>Website</h4>
                    <p><a href="https://sbf-consultancy.net" target="_blank" rel="noreferrer">sbf-consultancy.net</a></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-panel">
              {state.succeeded ? (
                <div className="success-message">
                  <ShieldCheck size={64} color="var(--wa-teal)" />
                  <h2>Message Sent!</h2>
                  <p>Thank you for reaching out. We'll get back to you shortly.</p>
                  <button className="btn-primary" onClick={() => window.location.reload()}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="premium-form">
                  <h3>Consultation Request</h3>
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" name="name" placeholder="John Doe" required />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input id="email" type="email" name="email" placeholder="john@example.com" required />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organization">Organization</label>
                    <input id="organization" type="text" name="organization" placeholder="Your Company Name" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" placeholder="Tell us about your requirements..." rows={5} required />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                  </div>

                  <button type="submit" disabled={state.submitting} className="submit-btn">
                    {state.submitting ? 'Sending...' : (
                      <>
                        <span>Submit Request</span>
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
