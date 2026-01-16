import React, { useState, useEffect } from 'react';
import AboutSection from './AboutSection';
import StatisticsSection from './StatisticsSection';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LandingPage.css';

interface LandingPageProps {
  onNavigate: (page: 'map' | 'leaderboard') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "What's my city's climate going to be for my kids?";

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 40); // Typing speed: 55ms per character (slightly slower, still smooth)

    return () => clearInterval(typingInterval);
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-container">
      <div 
        className="landing-page"
        style={{
          backgroundImage: 'url(/michael-heuser-tB-mIZJEdm8-unsplash.jpg)'
        }}
      >
        {/* Header Navigation */}
        <header className="landing-header">
          <div className="header-left">
            <div className="brand-name">ReforestNYC</div>
          </div>
          <nav className="header-nav">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('map'); }} className="nav-link">Map</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('leaderboard'); }} className="nav-link">Leaderboard</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToAbout(); }} className="nav-link">Mission</a>
            {user && (
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <div className="landing-main">
          <div className="mission-content">
            <div className="search-bar-container">
              <input
                type="text"
                className="giant-search-bar typing-animation"
                placeholder=""
                value={typedText + (showCursor ? '|' : '')}
                onClick={() => onNavigate('map')}
                readOnly
              />
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator" onClick={scrollToAbout}>
          <div className="scroll-arrow">↓</div>
          <span className="scroll-text">Scroll to learn more</span>
        </div>
      </div>

      {/* Statistics Section */}
      <StatisticsSection />

      {/* Mission Section */}
      <div id="about-section">
        <AboutSection onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default LandingPage;

