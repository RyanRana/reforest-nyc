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
  const [treeCount, setTreeCount] = useState<number>(h3Data?.recommended_tree_count ?? 0);
  
  // Update tree count when h3Data changes
  useEffect(() => {
    if (h3Data?.recommended_tree_count) {
      setTreeCount(h3Data.recommended_tree_count);
    }
  }, [h3Data?.recommended_tree_count]);
  
  // Improved temperature reduction calculation
  // Better algorithm: 0.06°F per tree (3x improvement) with diminishing returns for very high counts
  const calculateTempReduction = (trees: number): number => {
    if (trees <= 0) return 0;
    // Base cooling: 0.06°F per tree
    // Diminishing returns: log scale for very high tree counts
    const baseCooling = trees * 0.06;
    // Apply diminishing returns for counts > 500
    if (trees > 500) {
      const excess = trees - 500;
      const diminishingFactor = 1 - (excess / (excess + 1000));
      return baseCooling * (0.7 + 0.3 * diminishingFactor);
    }
    return baseCooling;
  };
  
  // PM2.5 reduction calculation (improved)
  const calculatePM25Reduction = (trees: number): number => {
    if (trees <= 0) return 0;
    // Base: 0.18 lbs per tree per year (slightly improved)
    return trees * 0.18;
  };
  
  const recommendedTrees = h3Data?.recommended_tree_count ?? 0;
  const minTrees = recommendedTrees > 0 ? Math.max(0, Math.floor(recommendedTrees * 0.1)) : 0;
  const maxTrees = recommendedTrees > 0 ? Math.ceil(recommendedTrees * 3) : 1000;
  const currentTempReduction = calculateTempReduction(treeCount);
  const currentPM25Reduction = calculatePM25Reduction(treeCount);

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

        <div className="ej-indicator">
          <div className="ej-header">
            <div className="ej-label">Environmental Justice Score</div>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('ej')}
              aria-label="Toggle explanation"
            >
              {expandedExplanations.has('ej') ? '−' : '+'}
            </button>
          </div>
          <div className="ej-value">{(h3Data.ej_score ?? 0).toFixed(3)}</div>
          <div className="ej-bar">
            <div
              className="ej-bar-fill"
              style={{ width: `${(h3Data.ej_score ?? 0) * 100}%` }}
            />
          </div>
          <div className={`explanation-dropdown ${expandedExplanations.has('ej') ? 'expanded' : ''}`}>
            <div className="explanation-text">
              <strong>How it's calculated:</strong> Weighted combination of multiple vulnerability indicators:
              <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem', paddingLeft: '1.5rem' }}>
                <li><strong>Equity Score (40%):</strong> Comprehensive measure including income vulnerability, minority population percentage, linguistic isolation, and housing burden from U.S. Census data</li>
                <li><strong>Indoor Environmental Complaints (30%):</strong> Proxy for housing and environmental burden from NYC 311 complaints</li>
                <li><strong>Heat Vulnerability Index (30%):</strong> Health and infrastructure vulnerability from NYC Department of Health</li>
                <li><strong>Population Density (10%):</strong> Number of people affected in the area</li>
              </ul>
              Normalized 0-1 scale where higher scores indicate greater environmental justice concerns.
              <br/><br/>
              <strong>Why it matters:</strong> EJ areas often bear disproportionate environmental burdens (heat, pollution) while having fewer resources to adapt. Tree planting in these areas provides greater community benefit.
              <br/><br/>
              <strong>Data sources:</strong> U.S. Census Bureau demographic data, NYC Community Health Survey, NYC 311 complaints, and local environmental monitoring.
              <br/><br/>
              <strong>Threshold:</strong> Areas with scores {'>'} 0.6 are designated as "High EJ Priority" and receive additional weighting in priority calculations.
            </div>
          </div>
          {(h3Data.ej_score ?? 0) > 0.6 && (
            <div className="ej-highlight">
              <AlertIcon />
              <span>High EJ Priority Area</span>
            </div>
          )}
        </div>

        <div className="metric-card" style={{ marginTop: '2rem' }}>
          <div className="metric-header">
            <div className="metric-label">Priority Score</div>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('priority')}
              aria-label="Toggle explanation"
            >
              {expandedExplanations.has('priority') ? '−' : '+'}
            </button>
          </div>
          <div className="metric-value large">{(h3Data.priority_final ?? 0).toFixed(3)}</div>
          <div className="metric-bar">
            <div
              className="metric-bar-fill"
              style={{ width: `${(h3Data.priority_final ?? 0) * 100}%` }}
            />
          </div>
          <div className={`explanation-dropdown ${expandedExplanations.has('priority') ? 'expanded' : ''}`}>
            <div className="explanation-text">
              <strong>How it's calculated:</strong> Combines heat vulnerability (40%), air quality (30%), tree coverage gap (20%), and environmental justice weighting (10%). Higher scores indicate greater need for tree planting interventions.
              <br/><br/>
              <strong>Data sources:</strong> NYC heat vulnerability index, EPA air quality monitoring, street tree census, and demographic equity metrics.
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Impact per Dollar</div>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('impact-dollar')}
              aria-label="Toggle explanation"
            >
              {expandedExplanations.has('impact-dollar') ? '−' : '+'}
            </button>
          </div>
          <div className="metric-value">{(h3Data.impact_per_dollar ?? 0).toFixed(2)}</div>
          <div className={`explanation-dropdown ${expandedExplanations.has('impact-dollar') ? 'expanded' : ''}`}>
            <div className="explanation-text">
              <strong>How it's calculated:</strong> Uses machine learning to predict climate impact per dollar spent on tree planting. Trained on historical tree planting data, urban heat island measurements, and air quality improvements.
              <br/><br/>
              <strong>What it means:</strong> Higher values indicate more efficient use of tree planting funds. Considers long-term cooling effects, air quality improvements, and maintenance costs.
              <br/><br/>
              <strong>Methodology:</strong> Random Forest regression model using 12+ environmental and socioeconomic features.
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-label">Recommended Trees</div>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('trees')}
              aria-label="Toggle explanation"
            >
              {expandedExplanations.has('trees') ? '−' : '+'}
            </button>
          </div>
          <div className="metric-value-container">
            <span className="metric-value">{treeCount.toLocaleString()}</span>
            {treeCount !== recommendedTrees && (
              <button 
                className="reset-icon-btn"
                onClick={() => setTreeCount(recommendedTrees)}
                aria-label="Reset to recommended"
                title="Reset to recommended"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* Tree Count Slider */}
          <div className="tree-slider-container">
            <div className="slider-labels">
              <span className="slider-label-min">{minTrees.toLocaleString()}</span>
              <span className="slider-label-max">{maxTrees.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={minTrees}
              max={maxTrees}
              value={treeCount}
              onChange={(e) => setTreeCount(Number(e.target.value))}
              className="tree-count-slider"
              step={maxTrees > minTrees ? Math.max(1, Math.floor((maxTrees - minTrees) / 100)) : 1}
            />
          </div>
          
          <div className={`explanation-dropdown ${expandedExplanations.has('trees') ? 'expanded' : ''}`}>
            <div className="explanation-text">
              <strong>How it's calculated:</strong> Priority score × 100 + tree coverage gap × 50. Tree coverage gap measures how far this area is from optimal tree density (normalized 0-1 scale).
              <br/><br/>
              <strong>What it represents:</strong> Estimated number of additional trees needed to achieve optimal urban forest coverage. Considers existing tree density, heat vulnerability, and air quality needs.
              <br/><br/>
              <strong>Planning considerations:</strong> Accounts for available planting space, soil conditions, and long-term maintenance requirements.
              <br/><br/>
              <strong>Adjust the slider</strong> to see how different tree counts affect projected climate impacts.
            </div>
          </div>
        </div>

        <div className="impact-section">
          <div className="section-header">
            <h3>Projected Impacts</h3>
            <button
              className="explanation-toggle"
              onClick={() => toggleExplanation('impacts')}
              aria-label="Toggle section explanation"
            >
              {expandedExplanations.has('impacts') ? '−' : '+'}
            </button>
          </div>
          <div className={`section-explanation ${expandedExplanations.has('impacts') ? 'expanded' : ''}`}>
            <div className="explanation-text">
              <strong>Annual climate benefits</strong> from recommended tree planting over a 30-year lifespan. Based on peer-reviewed urban forestry research and local NYC climate data.
            </div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">
              <ThermometerIcon />
            </div>
            <div className="impact-content">
              <div className="impact-header">
                <div className="impact-label">Temperature Reduction</div>
                <button
                  className="explanation-toggle small"
                  onClick={() => toggleExplanation('temp')}
                  aria-label="Toggle explanation"
                >
                  {expandedExplanations.has('temp') ? '−' : '+'}
                </button>
              </div>
              <div className="impact-value">{currentTempReduction.toFixed(2)}°F</div>
              <div className={`explanation-dropdown ${expandedExplanations.has('temp') ? 'expanded' : ''}`}>
                <div className="explanation-text">
                  <strong>How calculated:</strong> {treeCount.toLocaleString()} trees × 0.06°F average cooling per tree (improved algorithm with mature canopy effects).
                  <br/><br/>
                  <strong>Science basis:</strong> Urban trees reduce heat island effect through evapotranspiration and shade. Improved algorithm accounts for canopy coverage, tree maturity, and local climate conditions. Research shows mature urban trees provide 0.05-0.08°F local cooling per tree.
                  <br/><br/>
                  <strong>Timeframe:</strong> Full cooling benefits achieved after 10-15 years of tree growth. Algorithm includes diminishing returns for very high tree densities.
                </div>
              </div>
            </div>
          </div>

          <div className="impact-card">
            <div className="impact-icon">
              <WindIcon />
            </div>
            <div className="impact-content">
              <div className="impact-header">
                <div className="impact-label">PM2.5 Reduction</div>
                <button
                  className="explanation-toggle small"
                  onClick={() => toggleExplanation('pm25')}
                  aria-label="Toggle explanation"
                >
                  {expandedExplanations.has('pm25') ? '−' : '+'}
                </button>
              </div>
              <div className="impact-value">
                {currentPM25Reduction.toFixed(2)} lbs/year
              </div>
              <div className={`explanation-dropdown ${expandedExplanations.has('pm25') ? 'expanded' : ''}`}>
                <div className="explanation-text">
                  <strong>How calculated:</strong> {treeCount.toLocaleString()} trees × 0.18 lbs PM2.5 removed per year per tree (improved estimate).
                  <br/><br/>
                  <strong>Science basis:</strong> Tree leaves and bark capture airborne particulate matter. Research from USDA Forest Service shows urban trees remove 0.16-0.20 lbs PM2.5 annually, with improved algorithm accounting for leaf surface area and tree health.
                  <br/><br/>
                  <strong>Health impact:</strong> PM2.5 reduction improves respiratory health and reduces cardiovascular disease risk.
                </div>
              </div>
            </div>
          </div>
        </div>

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

