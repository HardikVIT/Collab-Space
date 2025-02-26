import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <main className="home">
      <div className="hero-section">
        <div className="content-wrapper">
          <h1>
            <span className="title-highlight">Collaborate</span> and
            <br />Create Together
          </h1>
          <p className="subtitle">
            Transform your ideas into reality with our powerful collaboration tools.
            Connect, create, and innovate with teams around the world.
          </p>
          <div className="button-group">
            <Link to="/login" className="primary-btn">Get Started</Link>
            <Link to="/whiteboard" className="secondary-btn">Try Demo</Link>
          </div>
          <div className="social-links">
            <a href="#" className="social-icon">Facebook</a>
            <a href="#" className="social-icon">Twitter</a>
            <a href="#" className="social-icon">LinkedIn</a>
          </div>
        </div>
        <div className="features-section">
          <Link to="/whiteboard" className="feature-card-link">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Interactive Whiteboard</h3>
              <p>Visualize your ideas in real-time</p>
            </div>
          </Link>
          
          <Link to="/ats" className="feature-card-link">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Application Tracking</h3>
              <p>Stay organized and efficient</p>
            </div>
          </Link>
          
          <Link to="/chatroom" className="feature-card-link">
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Chat Rooms</h3>
              <p>Communicate seamlessly</p>
            </div>
          </Link>
          
          <Link to="/chatbot" className="feature-card-link">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>Mock Interview</h3>
              <p>Get intelligent support</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Home;