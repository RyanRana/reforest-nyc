import React, { useState, useEffect } from 'react';
import ReviewSection from './ReviewSection';
import GreenInitiativesSection from './GreenInitiativesSection';
import '../styles/Sidebar.css';

// SVG Icons
const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const TreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-7"></path>
    <path d="M8 15h8"></path>
    <path d="M12 2v5"></path>
    <path d="M9 7h6"></path>
    <path d="M8 15a4 4 0 0 0 8 0"></path>
  </svg>
);


const ThermometerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"></path>
  </svg>
);

const WindIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"></path>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"></path>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"></path>
  </svg>
);


const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21h6"></path>
    <path d="M12 3a6 6 0 0 0-6 6c0 3.314 2.686 6 6 6s6-2.686 6-6a6 6 0 0 0-6-6z"></path>
    <path d="M12 15v3"></path>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <path d="M12 9v4"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
    <path d="M6 12h12"></path>
    <path d="M6 16h12"></path>
    <path d="M6 20h12"></path>
    <path d="M6 8h12"></path>
  </svg>
);

interface H3Data {
  h3_cell: string;
  location_name?: string;
  impact_per_dollar: number;
  recommended_tree_count: number;
  projected_temp_reduction_F: number;
  projected_pm25_reduction_lbs_per_year: number;
  projected_co2_reduction_kg_per_year?: number;
  current_co2_reduction_kg_per_year?: number;
  priority_final: number;
  ej_score: number;
  tree_count?: number;
  features: any;
}

interface SidebarProps {
  h3Data: H3Data | null;
  loading: boolean;
  onClose: () => void;
}

// Helper to build a human-readable location label
const getLocationLabel = (h3Data: H3Data) => {
  if (!h3Data) return 'this NYC area';
  return h3Data.location_name
    ? h3Data.location_name
    : `H3 cell ${h3Data.h3_cell}`;
};

// Helper to build the shareable text snippet (used for clipboard + X)
const buildShareText = (h3Data: H3Data) => {
  const locationLabel = getLocationLabel(h3Data);
  const priority = (h3Data.priority_final ?? 0).toFixed(3);
  const trees = (h3Data.recommended_tree_count ?? 0).toLocaleString();
  const temp = (h3Data.projected_temp_reduction_F ?? 0).toFixed(2);

  return `My neighborhood (${locationLabel}) is a ReforestNYC priority area: priority score ${priority}, ${trees} new trees = ~${temp}°F cooler. See your neighborhood's tree information at reforestnyc.com`;
};

// Helper to build a deep link back to this exact area
const buildShareUrl = (h3Data: H3Data) => {
  if (!h3Data) return '';
  // Point directly to the production domain so X/Twitter can generate a rich card
  const base = 'https://reforestnyc.com';
  const params = new URLSearchParams();
  params.set('h3', h3Data.h3_cell);
  return `${base}/?${params.toString()}`;
};

const Sidebar: React.FC<SidebarProps> = ({ h3Data, loading, onClose }) => {
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [prediction, setPrediction] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionYears, setPredictionYears] = useState(10);
  const [treesToPlant, setTreesToPlant] = useState(0); // New trees to plant now
  
  // Fetch prediction when h3Data, years, or treesToPlant changes
  // Use debouncing to avoid too many API calls
  useEffect(() => {
    if (!h3Data?.h3_cell) return;
    
    setPredictionLoading(true);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const currentTreeCount = (h3Data.tree_count || 0);
    const totalTreeCount = currentTreeCount + treesToPlant;
    
    // Debounce: wait 300ms after user stops changing sliders
    const timeoutId = setTimeout(() => {
      fetch(`${apiUrl}/predict?h3_cell=${h3Data.h3_cell}&years=${predictionYears}&tree_count=${totalTreeCount}`)
        .then(res => res.json())
        .then(data => {
          setPrediction(data);
          setPredictionLoading(false);
        })
        .catch(err => {
          console.error('Error fetching prediction:', err);
          setPredictionLoading(false);
        });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [h3Data?.h3_cell, predictionYears, treesToPlant]);
  

  const toggleExplanation = (metricId: string) => {
    const newExpanded = new Set(expandedExplanations);
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId);
    } else {
      newExpanded.add(metricId);
    }
    setExpandedExplanations(newExpanded);
  };

  const handleCopySummary = async () => {
    if (!h3Data) return;
    const text = buildShareText(h3Data);
    const url = buildShareUrl(h3Data);
    const full = `${text}\n\nExplore the map: ${url}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(full);
        alert('Shareable summary copied to your clipboard.');
      } else {
        // Fallback if Clipboard API not available
        window.prompt('Copy this summary:', full);
      }
    } catch (err) {
      console.error('Failed to copy share text', err);
      window.prompt('Copy this summary:', full);
    }
  };

  const handleShareOnX = () => {
    if (!h3Data) return;
    const text = buildShareText(h3Data);
    const url = buildShareUrl(h3Data);
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="sidebar">
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="sidebar-content">
          <div className="loading">
            <div className="loading-text">Analyzing neighborhood...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!h3Data) {
    return (
      <div className="sidebar">
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="sidebar-content">
          <div className="empty-state">
            <div className="empty-state-icon">
              <MapIcon />
            </div>
            <h2>Explore NYC Neighborhoods</h2>
            <p>Click on any neighborhood on the map to view:</p>
            <ul className="feature-list">
              <li>Priority scores</li>
              <li>Recommended tree counts</li>
              <li>Projected temperature reductions</li>
              <li>Air quality improvements</li>
              <li>Environmental justice indicators</li>
            </ul>
            <div className="empty-state-hint">
              <span className="hint-icon">
                <LightbulbIcon />
              </span>
              <span>Bright green areas indicate highest priority</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div className="sidebar-content">
        <h2>{h3Data.location_name || 'NYC'}</h2>
        {h3Data.location_name && (
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            H3: {h3Data.h3_cell}
          </p>
        )}
        {!h3Data.location_name && (
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            H3 Cell: {h3Data.h3_cell}
          </p>
        )}
        <div className="zip-divider"></div>

        {/* Reviews Section */}
        {h3Data && h3Data.features && (
          <ReviewSection zipcode={h3Data.features.zipcode || ''} h3Cell={h3Data.h3_cell} />
        )}

        {/* Green Initiatives Section */}
        {h3Data && h3Data.features && (
          <GreenInitiativesSection zipcode={h3Data.features.zipcode || ''} h3Cell={h3Data.h3_cell} />
        )}

        {/* EJ Score and Priority Score on same line */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <div className="metric-card" style={{ flex: '1', minWidth: 0 }}>
            <div className="metric-header">
              <div className="metric-label">Environmental Justice Score</div>
            </div>
            <div className="metric-value large">{(h3Data.ej_score ?? 0).toFixed(3)}</div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ width: `${(h3Data.ej_score ?? 0) * 100}%` }}
              />
            </div>
            {(h3Data.ej_score ?? 0) > 0.6 && (
              <div className="ej-highlight" style={{ marginTop: '0.75rem' }}>
                <AlertIcon />
                <span>High EJ Priority Area</span>
              </div>
            )}
          </div>

          <div className="metric-card" style={{ flex: '1', minWidth: 0 }}>
            <div className="metric-header">
              <div className="metric-label">Priority Score</div>
            </div>
            <div className="metric-value large">{(h3Data.priority_final ?? 0).toFixed(3)}</div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{ width: `${(h3Data.priority_final ?? 0) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Forward Projection Section */}
        {h3Data && (
          <div className="impact-section" style={{ marginTop: '2rem' }}>
            <div className="review-header">
              <div className="review-header-top">
                <h3>Future Predictions</h3>
              </div>
            </div>

            {/* New Trees to Plant */}
            <div className="metric-card" style={{ marginBottom: '1rem' }}>
              <div className="metric-header">
                <div className="metric-label">New Trees to Plant</div>
              </div>
              <div className="metric-value">{treesToPlant.toLocaleString()}</div>
              <div className="tree-slider-container">
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Recommended: {(h3Data.recommended_tree_count || 0).toLocaleString()} trees
                </div>
                <div className="slider-labels">
                  <span className="slider-label-min">0</span>
                  <span className="slider-label-max">{Math.max(200, (h3Data.recommended_tree_count || 0) * 2).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(200, (h3Data.recommended_tree_count || 0) * 2)}
                  value={treesToPlant}
                  onChange={(e) => setTreesToPlant(Number(e.target.value))}
                  className="tree-count-slider"
                  step={Math.max(1, Math.floor((Math.max(200, (h3Data.recommended_tree_count || 0) * 2)) / 100))}
                />
              </div>
            </div>

            {/* Years Ahead */}
            <div className="metric-card" style={{ marginBottom: '1rem' }}>
              <div className="metric-header">
                <div className="metric-label">Years Ahead</div>
              </div>
              <div className="metric-value">{predictionYears}</div>
              <div className="tree-slider-container">
                <div className="slider-labels">
                  <span className="slider-label-min">5</span>
                  <span className="slider-label-max">30</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={predictionYears}
                  onChange={(e) => setPredictionYears(Number(e.target.value))}
                  className="tree-count-slider"
                />
              </div>
            </div>

            {predictionLoading ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Loading prediction...</div>
            ) : prediction && prediction.summary && prediction.current_state && prediction.yearly_projections ? (
              <>
                {/* CO₂ Sequestration */}
                <div className="impact-card" style={{ marginBottom: '1rem' }}>
                  <div className="impact-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2v4"></path>
                      <path d="M12 18v4"></path>
                      <path d="M4.93 4.93l2.83 2.83"></path>
                      <path d="M16.24 16.24l2.83 2.83"></path>
                      <path d="M2 12h4"></path>
                      <path d="M18 12h4"></path>
                      <path d="M4.93 19.07l2.83-2.83"></path>
                      <path d="M16.24 7.76l2.83-2.83"></path>
                    </svg>
                  </div>
                  <div className="impact-content">
                    <div className="impact-label">CO₂ Sequestration Over Time</div>
                    <div className="impact-value">
                      {(prediction.summary.total_co2_sequestered_metric_tons || 0).toFixed(1)} metric tons
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                      Total over {predictionYears} years
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Now: {((prediction.current_state.co2_sequestration_kg_per_year || 0) / 1000).toFixed(2)}t/year</span>
                      <span>→</span>
                      <span>In {predictionYears} years: {((prediction.yearly_projections[prediction.yearly_projections.length - 1]?.co2_sequestration_kg_per_year || 0) / 1000).toFixed(2)}t/year</span>
                    </div>
                  </div>
                </div>

                {/* Temperature Reduction */}
                <div className="impact-card" style={{ marginBottom: '1rem' }}>
                  <div className="impact-icon">
                    <ThermometerIcon />
                  </div>
                  <div className="impact-content">
                    <div className="impact-label">Temperature Reduction Over Time</div>
                    <div className="impact-value">
                      {(prediction.summary.avg_temperature_reduction_f || 0).toFixed(2)}°F
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                      Average over {predictionYears} years
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Now: {(prediction.current_state.temperature_reduction_f || 0).toFixed(2)}°F</span>
                      <span>→</span>
                      <span>In {predictionYears} years: {(prediction.yearly_projections[prediction.yearly_projections.length - 1]?.temperature_reduction_f || 0).toFixed(2)}°F</span>
                    </div>
                  </div>
                </div>

              </>
            ) : prediction ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
                Error: Invalid prediction data. Please try again.
              </div>
            ) : null}
          </div>
        )}

        {/* Tree Breakdown Section */}
        <div className="impact-section">
          <div className="section-header">
            <h3>Tree Breakdown in This Area</h3>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('tree-breakdown')}
              aria-label="Toggle section"
            >
              {expandedExplanations.has('tree-breakdown') ? '−' : '+'}
            </button>
          </div>
          {expandedExplanations.has('tree-breakdown') && (
            <>
              <div className="section-explanation">
                <div className="explanation-text">
                  <strong>Current tree inventory</strong> data from the 2015 NYC Street Tree Census. This shows the existing tree population in this hexagonal area.
                </div>
              </div>

              {h3Data.features && (
                <>
                  <div className="impact-card">
                    <div className="impact-icon">
                      <TreeIcon />
                    </div>
                    <div className="impact-content">
                      <div className="impact-label">Total Trees</div>
                      <div className="impact-value">
                        {(h3Data.features.tree_count || h3Data.tree_count || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="impact-card">
                    <div className="impact-icon">
                      <MapIcon />
                    </div>
                    <div className="impact-content">
                      <div className="impact-label">Tree Density</div>
                      <div className="impact-value">
                        {(h3Data.features.tree_density_per_km2 || 0).toFixed(0)} trees/km²
                      </div>
                    </div>
                  </div>

                  {h3Data.features.avg_dbh && (
                    <div className="impact-card">
                      <div className="impact-icon">
                        <BuildingIcon />
                      </div>
                      <div className="impact-content">
                        <div className="impact-label">Average Tree Size</div>
                        <div className="impact-value">
                          {(h3Data.features.avg_dbh ?? 0).toFixed(1)}" DBH
                        </div>
                        {h3Data.features.min_dbh && h3Data.features.max_dbh && (
                          <div className="impact-subtext">
                            Range: {h3Data.features.min_dbh}" - {h3Data.features.max_dbh}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {h3Data.features.health_pct !== undefined && (
                    <div className="impact-card">
                      <div className="impact-icon">
                        <LightbulbIcon />
                      </div>
                      <div className="impact-content">
                        <div className="impact-label">Tree Health</div>
                        <div className="impact-value">
                          {((h3Data.features.health_pct ?? 0) * 100).toFixed(1)}% in good health
                        </div>
                      </div>
                    </div>
                  )}

                  {h3Data.features.cell_area_km2 && (
                    <div className="impact-card">
                      <div className="impact-icon">
                        <MapIcon />
                      </div>
                      <div className="impact-content">
                        <div className="impact-label">Area Coverage</div>
                        <div className="impact-value">
                          {((h3Data.features.cell_area_km2 ?? 0) * 100).toFixed(2)} hectares
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="zip-divider"></div>

        {/* Shareable artifact section */}
        <div className="share-section">
          <div className="share-title">Share this area</div>
          <div className="share-actions">
            <button className="share-button" onClick={handleCopySummary}>
              Copy summary
            </button>
            <button className="share-button secondary" onClick={handleShareOnX}>
              Share on X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

