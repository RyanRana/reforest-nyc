import React, { useState, useEffect } from 'react';
import '../styles/StatisticsSection.css';

interface Statistic {
  number: string;
  description: string;
  source: string;
}

const StatisticsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSource, setExpandedSource] = useState(false);

  const statistics: Statistic[] = [
    {
      number: '525 deaths',
      description: 'preventable heat-related deaths annually in NYC',
      source: 'NYC Health Department 2025 Heat Mortality Report'
    },
    {
      number: '69 days/year',
      description: 'above 90°F in the 2050s (4x today\'s average)',
      source: 'NPCC4 (2024) projections'
    },
    {
      number: '16.5″',
      description: 'projected sea level rise by the 2050s',
      source: 'NPCC4 (2024) and NOAA-aligned projections'
    },
    {
      number: '$163B',
      description: 'total projected future climate costs for NYC (taxpayer burden) through 2050',
      source: 'NPCC4 (2024) Economic Impact Assessment'
    }
  ];

  const toggleSource = () => {
    setExpandedSource(prev => !prev);
  };

  const nextStatistic = () => {
    setCurrentIndex((prev) => (prev + 1) % statistics.length);
    setExpandedSource(false);
  };

  const prevStatistic = () => {
    setCurrentIndex((prev) => (prev - 1 + statistics.length) % statistics.length);
    setExpandedSource(false);
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextStatistic();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const currentStat = statistics[currentIndex];

  return (
    <section className="statistics-section">
      <div className="statistics-container">
        <div className="statistic-card">
          <div className="statistic-number">{currentStat.number}</div>
          <p className="statistic-description">{currentStat.description}</p>
          <button 
            className="statistic-source-link"
            onClick={toggleSource}
          >
            {expandedSource ? currentStat.source : 'Source'}
          </button>
        </div>
        
        {/* Navigation dots */}
        <div className="statistics-nav">
          {statistics.map((_, index) => (
            <button
              key={index}
              className={`nav-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setExpandedSource(false);
              }}
              aria-label={`Go to statistic ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        <button className="stat-nav-arrow stat-nav-prev" onClick={prevStatistic} aria-label="Previous statistic">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button className="stat-nav-arrow stat-nav-next" onClick={nextStatistic} aria-label="Next statistic">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
};

export default StatisticsSection;
