import React from 'react';
import '../styles/MapInstructions.css';

// SVG Icons for Instructions
const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
    <line x1="2" y1="20" x2="22" y2="20"></line>
  </svg>
);

const ThermometerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"></path>
  </svg>
);

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

interface MapInstructionsProps {
  onDismiss: () => void;
}

const MapInstructions: React.FC<MapInstructionsProps> = ({ onDismiss }) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on the content
    if (e.target === e.currentTarget) {
      onDismiss();
    }
  };

  return (
    <div className="map-instructions-overlay" onClick={handleOverlayClick}>
      <div className="map-instructions-content">
        <button className="instructions-close" onClick={onDismiss} aria-label="Close instructions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="instructions-header">
          <h2>Explore ReforestNYC</h2>
          <p>Click any hexagonal area to see tree planting recommendations</p>
        </div>

        <div className="instructions-grid">
          <div className="instruction-card">
            <div className="instruction-icon"><MapIcon /></div>
            <h3>Navigate the Map</h3>
            <p>Zoom in/out and pan around NYC to explore different neighborhoods</p>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon"><TargetIcon /></div>
            <h3>Click Hexagons</h3>
            <p>Select any hexagonal area to view detailed climate analysis and tree planting recommendations</p>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon"><SearchIcon /></div>
            <h3>Explore by Area</h3>
            <p>Each hexagon represents a uniform area for consistent spatial analysis across NYC</p>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon"><ChartIcon /></div>
            <h3>Tree Density Colors</h3>
            <p>
              <span className="priority-high">Dark green</span> = High tree density<br/>
              <span className="priority-medium">Yellow/orange</span> = Medium density<br/>
              <span className="priority-low">Light yellow</span> = Low density (planting opportunities!)
            </p>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon"><ThermometerIcon /></div>
            <h3>Climate Analysis</h3>
            <p>View temperature reduction potential, air quality improvements, and equity considerations</p>
          </div>

          <div className="instruction-card">
            <div className="instruction-icon"><TrendingUpIcon /></div>
            <h3>Impact Projections</h3>
            <p>See 30-year climate benefits from strategic tree planting in each area</p>
          </div>
        </div>

        <div className="instructions-footer">
          <p>💡 <strong>Pro tip:</strong> Areas with high heat vulnerability and environmental justice concerns receive priority weighting</p>
          <button className="dismiss-instructions" onClick={onDismiss}>
            Got it! Start exploring →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapInstructions;
