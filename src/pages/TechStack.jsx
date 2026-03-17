import React from 'react';
import { 
  Code2, Cpu, Database, Globe, 
  Layers, Lock, Smartphone, Zap, 
  Terminal, Server, Layout, Sparkles
} from 'lucide-react';

const TechStack = () => {
  const stack = [
    {
      category: "Frontend Core",
      icon: <Layout className="tech-cat-icon" />,
      techs: [
        { name: "React 19", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" },
        { name: "Vite 7", logo: "https://vitejs.dev/logo.svg" },
        { name: "Lucide React", logo: "https://lucide.dev/logo.svg" }
      ]
    },
    {
      category: "Backend & Infrastructure",
      icon: <Server className="tech-cat-icon" />,
      techs: [
        { name: "Node.js", logo: "https://nodejs.org/static/images/logo.svg" },
        { name: "Express 5", logo: "https://expressjs.com/images/favicon.png" },
        { name: "Socket.io", logo: "https://socket.io/images/logo.svg" }
      ]
    },
    {
      category: "Database & Auth",
      icon: <Database className="tech-cat-icon" />,
      techs: [
        { name: "Firebase Auth", logo: "https://www.gstatic.com/devrel-devsite/prod/v773723579528/firebase/images/favicon.png" },
        { name: "Firestore", logo: "https://www.gstatic.com/devrel-devsite/prod/v773723579528/firebase/images/favicon.png" },
        { name: "Cloud Storage", logo: "https://www.gstatic.com/devrel-devsite/prod/v773723579528/firebase/images/favicon.png" }
      ]
    },
    {
      category: "Advanced Features",
      icon: <Cpu className="tech-cat-icon" />,
      techs: [
        { name: "Gemini 2.0 AI", logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" },
        { name: "WebRTC", logo: "https://webrtc.org/assets/images/webrtc-logo-vert-retro-255x305.png" },
        { name: "Web Audio API", logo: "https://developer.mozilla.org/favicon-48x48.bc339281e02efcf363b9f.png" }
      ]
    }
  ];

  return (
    <div className="landing-page">
      <section className="tech-hero">
        <div className="container">
          <div className="section-header centered">
            <span className="section-label">Our Stack</span>
            <h1>Built with Modern <br /> Enterprise Technology</h1>
            <p>Our architecture is optimized for speed, reliability, and security across all platforms.</p>
          </div>

          <div className="tech-grid">
            {stack.map((group, i) => (
              <div key={i} className="tech-card">
                <div className="tech-card-header">
                  {group.icon}
                  <h3>{group.category}</h3>
                </div>
                <div className="tech-list">
                  {group.techs.map((t, j) => (
                    <div key={j} className="tech-item">
                      {/* Using icons instead of broken logos for now for reliability */}
                      <Zap size={18} className="tech-bullet" />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="architecture-highlights">
        <div className="container">
          <div className="architecture-grid">
            <div className="arch-card">
              <Zap className="arch-icon" />
              <h3>Signaling Server</h3>
              <p>Custom Node.js/Socket.io signaling for efficient peer-to-peer WebRTC connections.</p>
            </div>
            <div className="arch-card">
              <Lock className="arch-icon" />
              <h3>Secure Protocol</h3>
              <p>Full HTTPS & WSS implementation with mkcert for local mobile development.</p>
            </div>
            <div className="arch-card">
              <Smartphone className="arch-icon" />
              <h3>Capacitor Ready</h3>
              <p>Architected for easy native deployment on Android and iOS using Capacitor.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechStack;
