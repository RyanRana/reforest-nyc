import React, { useState } from 'react';
import '../styles/AboutSection.css';

interface AboutSectionProps {
  onNavigate?: (page: 'map') => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate }) => {
  const [openSections, setOpenSections] = useState<{
    tech: boolean;
    algorithms: boolean;
    dataSources: boolean;
  }>({
    tech: false,
    algorithms: false,
    dataSources: false,
  });

  const handleMapClick = () => {
    if (onNavigate) {
      onNavigate('map');
    }
  };

  const toggleSection = (section: 'tech' | 'algorithms' | 'dataSources') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="about-section">
      {/* Explore the Map */}
      <section className="about-subsection explore-map">
        <div className="subsection-content">
          <h2 className="subsection-title">Explore the Map</h2>
          <div className="map-preview-container" onClick={handleMapClick}>
            <div className="map-frame">
              <img 
                src="/map-preview.jpg" 
                alt="NYC Climate Resilience Map - Priority Scores Visualization" 
                className="map-preview-image"
                loading="lazy"
              />
              <div className="map-overlay">
                <div className="map-click-hint">
                  <span className="click-text">Click to explore interactive map</span>
                  <span className="click-arrow">→</span>
                </div>
              </div>
            </div>
            <p className="map-description">
              Interactive visualization showing priority scores, environmental justice indicators, heat vulnerability, and air quality data across NYC ZIP codes. Click any area to see detailed impact predictions and recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* What It Does */}
      <section className="about-subsection what-it-does">
        <div className="subsection-content">
          <h2 className="subsection-title">What It Does</h2>
          <p className="subsection-text">
            ReforestNYC is a data-driven platform that identifies optimal street tree planting locations across New York City to maximize climate resilience and environmental justice. Powered by a sophisticated combination of low-latency C++ neural networks and random forest ensemble models, the system analyzes heat vulnerability, air quality, existing tree density, and socioeconomic factors to provide evidence-based recommendations that ensure every dollar invested in tree planting delivers maximum impact where it matters most.
          </p>
          <p className="subsection-text">
            The platform leverages cutting-edge machine learning architecture: C++ neural networks deliver sub-10ms predictions for real-time interactivity, while random forest models capture complex feature interactions and provide interpretable insights. This hybrid approach combines the speed of neural networks with the robustness and interpretability of ensemble methods, enabling city planners, advocates, and citizens to understand where trees should be planted to combat urban heat islands, improve air quality, and prioritize vulnerable communities.
          </p>
        </div>
      </section>

      {/* Open Source */}
      <section className="about-subsection open-source">
        <div className="subsection-content">
          <h2 className="subsection-title">Open Source</h2>
          <div className="open-source-content">
            <p className="subsection-text">
              ReforestNYC is built on open-source principles, making our code, data pipelines, and machine learning models publicly available for transparency, collaboration, and community improvement.
            </p>
            <div className="github-link-container">
              <a 
                href="https://github.com/RyanRana/Mesh-Landing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                <svg className="github-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span className="github-text">View on GitHub</span>
                <span className="github-arrow">→</span>
              </a>
            </div>
            <p className="subsection-text" style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#718096' }}>
              Contribute, fork, or use our codebase to build your own climate resilience tools. All datasets, models, and documentation are freely available.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-subsection tech-stack">
        <div className="subsection-content">
          <div className="dropdown-header" onClick={() => toggleSection('tech')}>
            <div>
              <h2 className="dropdown-title">Technology Stack</h2>
              <p className="dropdown-description">Frontend, backend, data processing, and machine learning technologies powering the platform</p>
            </div>
            <span className={`dropdown-arrow ${openSections.tech ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.tech && (
            <div className="dropdown-content">
              <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-category">Frontend</div>
              <div className="tech-list">
                <span>React 18</span>
                <span>TypeScript</span>
                <span>Mapbox GL JS</span>
                <span>CSS Modules</span>
              </div>
            </div>
            <div className="tech-item">
              <div className="tech-category">Backend</div>
              <div className="tech-list">
                <span>Node.js</span>
                <span>Express</span>
                <span>TypeScript</span>
                <span>REST API</span>
              </div>
            </div>
            <div className="tech-item">
              <div className="tech-category">Data Processing</div>
              <div className="tech-list">
                <span>Python 3.8+</span>
                <span>Pandas</span>
                <span>GeoPandas</span>
                <span>Scikit-learn</span>
              </div>
            </div>
            <div className="tech-item">
              <div className="tech-category">Machine Learning</div>
              <div className="tech-list">
                <span>C++17 Neural Networks</span>
                <span>Random Forest</span>
                <span>Ensemble Methods</span>
                <span>H3 Geospatial</span>
              </div>
            </div>
            <div className="tech-item">
              <div className="tech-category">Data Storage</div>
              <div className="tech-list">
                <span>Parquet</span>
                <span>GeoJSON</span>
                <span>Shapefiles</span>
                <span>JSON Metadata</span>
              </div>
            </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Algorithms */}
      <section 
        className="about-subsection algorithms"
        style={{
          backgroundImage: 'url(/landing.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="subsection-content">
          <div className="dropdown-header" onClick={() => toggleSection('algorithms')}>
            <div>
              <h2 className="dropdown-title">Algorithms & Methodology</h2>
              <p className="dropdown-description">Neural networks, random forests, and hybrid models for impact prediction</p>
            </div>
            <span className={`dropdown-arrow ${openSections.algorithms ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.algorithms && (
            <div className="dropdown-content">
              <div className="algorithm-content">
            <div className="algorithm-item">
              <h3 className="algorithm-name">Low-Latency C++ Neural Networks</h3>
              <p className="algorithm-description">
                Our core prediction engine leverages custom-built neural networks implemented in C++17 for sub-10ms inference latency. The multi-layer perceptron architecture processes geospatial features, environmental indicators, and socioeconomic factors to predict temperature reduction (°F) and PM2.5 removal (lbs/year) with high precision. Compiled to native machine code, these models deliver real-time predictions at scale, enabling interactive exploration of thousands of ZIP codes simultaneously.
              </p>
            </div>
            <div className="algorithm-item">
              <h3 className="algorithm-name">Random Forest Ensemble</h3>
              <p className="algorithm-description">
                Complementing the neural network, a random forest model captures non-linear interactions and feature importance across 200+ decision trees. This ensemble approach provides robust predictions for complex urban environments where multiple factors interact synergistically. The random forest handles feature interactions that linear models miss, particularly the relationship between tree density, heat vulnerability, and air quality improvements.
              </p>
            </div>
            <div className="algorithm-item">
              <h3 className="algorithm-name">Hybrid Model Architecture</h3>
              <p className="algorithm-description">
                The system combines neural network predictions with random forest outputs through a weighted ensemble, optimizing for both accuracy and interpretability. Neural networks excel at capturing complex patterns in high-dimensional space, while random forests provide feature importance rankings and handle missing data gracefully. This hybrid approach achieves superior performance compared to either model alone, with neural networks providing speed and random forests ensuring robustness.
              </p>
            </div>
            <div className="algorithm-item">
              <h3 className="algorithm-name">Priority Score Calculation</h3>
              <p className="algorithm-description">
                Combines normalized heat vulnerability, air quality metrics, tree density gaps, and pollution proxies with weighted coefficients (35% heat, 25% air quality, 25% tree gap, 15% pollution proxy). The model outputs are integrated into a unified priority score that maximizes impact per dollar invested.
              </p>
            </div>
            <div className="algorithm-item">
              <h3 className="algorithm-name">Environmental Justice Amplification</h3>
              <p className="algorithm-description">
                Applies a 40% multiplier to priority scores for neighborhoods with high EJ indicators (heat vulnerability, indoor environmental complaints, population density), ensuring vulnerable communities are prioritized. Both neural network and random forest models incorporate EJ features as explicit inputs, ensuring environmental justice is baked into the prediction architecture.
              </p>
            </div>
            <div className="algorithm-item">
              <h3 className="algorithm-name">Spatial Optimization</h3>
              <p className="algorithm-description">
                Uses H3 geospatial indexing for efficient spatial queries and ZIP-level aggregation for city-wide optimization. The C++ inference engine processes spatial features in parallel, enabling real-time updates as users explore different neighborhoods. Random forest feature importance guides spatial feature engineering, identifying which geographic relationships matter most for impact prediction.
              </p>
            </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Data Sources */}
      <section className="about-subsection data-sources">
        <div className="subsection-content">
          <div className="dropdown-header" onClick={() => toggleSection('dataSources')}>
            <div>
              <h2 className="dropdown-title">Data Sources</h2>
              <p className="dropdown-description">NYC Open Data sources including trees, heat vulnerability, air quality, and environmental justice indicators</p>
            </div>
            <span className={`dropdown-arrow ${openSections.dataSources ? 'open' : ''}`}>▼</span>
          </div>
          {openSections.dataSources && (
            <div className="dropdown-content">
              <div className="data-grid">
            <div className="data-item">
              <h3 className="data-name">Street Trees 2015</h3>
              <p className="data-description">Complete inventory of 683,000+ street trees across NYC</p>
              <p className="data-source">NYC Parks Department</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Heat Vulnerability Index</h3>
              <p className="data-description">ZIP-level heat vulnerability scores</p>
              <p className="data-source">NYC Department of Health</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Air Quality Data</h3>
              <p className="data-description">Community District PM2.5 and NO2 measurements</p>
              <p className="data-source">NYC Community Air Survey</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Fuel Oil Usage</h3>
              <p className="data-description">ZIP-level fuel oil consumption data</p>
              <p className="data-source">NYC Department of Buildings</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Indoor Environmental</h3>
              <p className="data-description">311 complaints by ZIP code</p>
              <p className="data-source">NYC Open Data</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Cooling Sites</h3>
              <p className="data-description">Cooling center locations</p>
              <p className="data-source">NYC Emergency Management</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">ZIP Boundaries</h3>
              <p className="data-description">Geographic boundaries for ZIP codes</p>
              <p className="data-source">TIGER/Line Shapefiles</p>
            </div>
            <div className="data-item">
              <h3 className="data-name">Population Data</h3>
              <p className="data-description">Community District population statistics</p>
              <p className="data-source">US Census Bureau</p>
            </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* About the Team */}
      <section 
        className="about-subsection team-section"
        style={{
          backgroundImage: 'url(/untitled.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="subsection-content">
          <h2 className="subsection-title">About the Team</h2>
          <div className="team-content">
            <div className="team-member">
              <div className="team-photo-placeholder">
                <span className="photo-placeholder-text">Photo</span>
              </div>
              <div className="team-info">
                <h3 className="team-name">Team Member</h3>
                <p className="team-role">Role & Description</p>
                <p className="team-bio">
                  Brief bio about the team member and their contribution to the project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutSection;

