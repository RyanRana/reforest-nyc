import React from 'react';
import '../styles/PredictionChart.css';

interface YearlyPrediction {
  year: number;
  tree_count: number;
  avg_dbh_cm: number;
  survival_rate: number;
  co2_sequestration_kg_per_year: number;
  co2_cumulative_kg: number;
  temperature_reduction_f: number;
  pm25_reduction_lbs_per_year: number;
}

interface PredictionResult {
  h3_cell?: string;
  zipcode?: string;
  base_year: number;
  projection_years: number;
  current_state: {
    tree_count: number;
    avg_dbh_cm: number;
    co2_sequestration_kg_per_year: number;
    temperature_reduction_f: number;
    pm25_reduction_lbs_per_year: number;
  };
  yearly_projections: YearlyPrediction[];
  summary: {
    final_tree_count: number;
    total_co2_sequestered_kg: number;
    total_co2_sequestered_metric_tons: number;
    avg_temperature_reduction_f: number;
    total_pm25_reduced_lbs: number;
  };
}

interface PredictionChartProps {
  prediction: PredictionResult | null;
  loading: boolean;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ prediction, loading }) => {
  if (loading) {
    return (
      <div className="prediction-chart">
        <div className="loading">Loading prediction...</div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  // Calculate max values for scaling, ensuring we have valid numbers
  const co2Values = [
    ...prediction.yearly_projections.map(p => p.co2_sequestration_kg_per_year || 0),
    prediction.current_state?.co2_sequestration_kg_per_year || 0
  ].filter(v => !isNaN(v) && isFinite(v));
  
  const tempValues = [
    ...prediction.yearly_projections.map(p => p.temperature_reduction_f || 0),
    prediction.current_state?.temperature_reduction_f || 0
  ].filter(v => !isNaN(v) && isFinite(v));

  const maxCo2 = co2Values.length > 0 ? Math.max(...co2Values) : 1;
  const maxTemp = tempValues.length > 0 ? Math.max(...tempValues) : 1;

  return (
    <div className="prediction-chart">
      <div className="prediction-summary">
        <div className="summary-item">
          <span className="summary-label">Final Trees:</span>
          <span className="summary-value">{prediction.summary.final_tree_count.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total CO₂:</span>
          <span className="summary-value">{prediction.summary.total_co2_sequestered_metric_tons.toFixed(1)} metric tons</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Temp Reduction:</span>
          <span className="summary-value">{prediction.summary.avg_temperature_reduction_f.toFixed(2)}°F</span>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-section">
          <h4>CO₂ Sequestration Over Time</h4>
          <div className="chart-bars-wrapper">
            <div className="chart-bars">
              {/* Current state bar */}
              <div className="chart-bar-group">
                <div className="chart-bar-label">{prediction.base_year}</div>
                <div className="chart-bar-container">
                  <div
                    className="chart-bar co2-bar current-bar"
                    style={{
                      height: `${Math.max((prediction.current_state.co2_sequestration_kg_per_year / maxCo2) * 100, 10)}%`,
                      minHeight: '20px'
                    }}
                    title={`${prediction.current_state.co2_sequestration_kg_per_year.toFixed(0)} kg/year (current)`}
                  />
                </div>
                <div className="chart-bar-value">
                  {(prediction.current_state.co2_sequestration_kg_per_year / 1000).toFixed(1)}t
                </div>
              </div>
              {/* Projected bars */}
              {prediction.yearly_projections.map((proj, idx) => {
                const height = maxCo2 > 0 ? Math.max((proj.co2_sequestration_kg_per_year / maxCo2) * 100, 10) : 10;
                return (
                  <div key={idx} className="chart-bar-group">
                    <div className="chart-bar-label">{proj.year}</div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar co2-bar"
                        style={{
                          height: `${height}%`,
                          minHeight: '20px'
                        }}
                        title={`${proj.co2_sequestration_kg_per_year.toFixed(0)} kg/year`}
                      />
                    </div>
                    <div className="chart-bar-value">
                      {(proj.co2_sequestration_kg_per_year / 1000).toFixed(1)}t
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="chart-section">
          <h4>Temperature Reduction Over Time</h4>
          <div className="chart-bars-wrapper">
            <div className="chart-bars">
              {/* Current state bar */}
              <div className="chart-bar-group">
                <div className="chart-bar-label">{prediction.base_year}</div>
                <div className="chart-bar-container">
                  <div
                    className="chart-bar temp-bar current-bar"
                    style={{
                      height: `${Math.max((prediction.current_state.temperature_reduction_f / maxTemp) * 100, 10)}%`,
                      minHeight: '20px'
                    }}
                    title={`${prediction.current_state.temperature_reduction_f.toFixed(2)}°F (current)`}
                  />
                </div>
                <div className="chart-bar-value">
                  {prediction.current_state.temperature_reduction_f.toFixed(2)}°F
                </div>
              </div>
              {/* Projected bars */}
              {prediction.yearly_projections.map((proj, idx) => {
                const height = maxTemp > 0 ? Math.max((proj.temperature_reduction_f / maxTemp) * 100, 10) : 10;
                return (
                  <div key={idx} className="chart-bar-group">
                    <div className="chart-bar-label">{proj.year}</div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar temp-bar"
                        style={{
                          height: `${height}%`,
                          minHeight: '20px'
                        }}
                        title={`${proj.temperature_reduction_f.toFixed(2)}°F`}
                      />
                    </div>
                    <div className="chart-bar-value">
                      {proj.temperature_reduction_f.toFixed(2)}°F
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="prediction-table">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Trees</th>
              <th>Avg DBH (cm)</th>
              <th>CO₂ (kg/year)</th>
              <th>Temp (°F)</th>
              <th>PM2.5 (lbs/year)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="current-state">
              <td>{prediction.base_year} (Current)</td>
              <td>{prediction.current_state.tree_count}</td>
              <td>{prediction.current_state.avg_dbh_cm.toFixed(1)}</td>
              <td>{prediction.current_state.co2_sequestration_kg_per_year.toFixed(0)}</td>
              <td>{prediction.current_state.temperature_reduction_f.toFixed(2)}</td>
              <td>{prediction.current_state.pm25_reduction_lbs_per_year.toFixed(1)}</td>
            </tr>
            {prediction.yearly_projections.map((proj, idx) => (
              <tr key={idx}>
                <td>{proj.year}</td>
                <td>{proj.tree_count}</td>
                <td>{proj.avg_dbh_cm.toFixed(1)}</td>
                <td>{proj.co2_sequestration_kg_per_year.toFixed(0)}</td>
                <td>{proj.temperature_reduction_f.toFixed(2)}</td>
                <td>{proj.pm25_reduction_lbs_per_year.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
