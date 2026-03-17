import React from 'react';
import { 
  ShieldCheck, Sparkles, MessageSquare, Mic, 
  Video, Calendar, Database, Users, Lock, 
  FileText, Smartphone, Laptop
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Lock size={32} />,
      title: "End-to-End Encryption",
      description: "Every message, voice note, and file is encrypted at the source and can only be decrypted by the intended recipient."
    },
    {
      icon: <Sparkles size={32} />,
      title: "Ethical AI Assistant",
      description: "Integrated Gemini 2.0 AI helps you draft professional messages, translate to Urdu, and apply Shariah-compliant greetings."
    },
    {
      icon: <Video size={32} />,
      title: "Voice & Video Calls",
      description: "High-quality, low-latency signaling server ensures reliable communication for team meetings or community huddles."
    },
    {
      icon: <Database size={32} />,
      title: "Automated Daily Backups",
      description: "Our 1 AM automated system ensures your communal history is backed up to secure Firestore storage every single day."
    },
    {
      icon: <Mic size={32} />,
      title: "Base64 Voice Notes",
      description: "Cross-platform compatible voice notes stored efficiently as base64 strings for instant playback anywhere."
    },
    {
      icon: <Users size={32} />,
      title: "Group Management",
      description: "Create private groups for specific departments, initiatives, or family units with full control over access."
    }
  ];

  return (
    <div className="landing-page">
      <section className="features-hero">
        <div className="container">
          <div className="section-header centered">
            <span className="section-label">Capabilities</span>
            <h1>Powerful Features for <br /> modern communities</h1>
            <p>Ummah-Sync combines professional-grade communication tools with a Shariah-centric design philosophy.</p>
          </div>
          
          <div className="feature-showcase-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-showcase-card">
                <div className="showcase-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="special-feature-section">
        <div className="container">
          <div className="special-feature-box">
            <div className="special-content">
              <span>Unique Integration</span>
              <h2>Shariah-Compliant AI</h2>
              <p>
                Unlike generic platforms, ummah-sync features a fine-tuned AI assistant specifically designed 
                to respect Islamic etiquette, suggest formal Urdu translations, and help maintain professional decorum.
              </p>
              <ul className="check-list">
                <li><ShieldCheck size={18} /> Automatic Islamic Greetings</li>
                <li><ShieldCheck size={18} /> Professional Urdu Translation</li>
                <li><ShieldCheck size={18} /> Formal Business Refinement</li>
                <li><ShieldCheck size={18} /> Shariah-Aware Suggestions</li>
              </ul>
            </div>
            <div className="special-visual">
              <div className="ai-interface-preview">
                {/* Visual representation of AI suggestion bubbles */}
                <div className="ai-bubble">"As-salamu alaykum, I hope you are well..."</div>
                <div className="ai-bubble Urdu">"اسلام علیکم، امید ہے آپ خیریت سے ہونگے..."</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
