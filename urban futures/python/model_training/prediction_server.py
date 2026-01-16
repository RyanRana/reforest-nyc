#!/usr/bin/env python3
"""
Fast prediction server that keeps the model loaded in memory.

This avoids the overhead of:
- Spawning new Python processes
- Loading pickle files repeatedly
- Re-importing libraries

Usage:
    python prediction_server.py
    
Then call from Node.js:
    POST http://localhost:3002/predict
    Body: {"tree_count": 48, "avg_dbh": 10.0, "years": 10}
"""

import json
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import pickle
import threading

# Add parent directory to path
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"
sys.path.insert(0, str(BASE_DIR / "python" / "model_training"))

# Load baseline temperature trend
baseline_trend = None
trend_path = MODELS_DIR / "baseline_temperature_trend.json"
if trend_path.exists():
    with open(trend_path, 'r') as f:
        baseline_trend = json.load(f)
    print(f"✅ Loaded baseline temperature trend:")
    print(f"   Warming rate: {baseline_trend['recent_slope_f_per_year']:.4f}°F/year")
    print(f"   Baseline ({baseline_trend['baseline_year']}): {baseline_trend['baseline_temperature_f']:.1f}°F")
else:
    print("⚠️  Baseline temperature trend not found, using default warming rate")
    baseline_trend = {
        'recent_slope_f_per_year': 0.054,  # Default from analysis
        'baseline_year': 2025,
        'baseline_temperature_f': 40.1
    }

# Try to load ML model first, fallback to rule-based
try:
    from ml_tree_growth_predictor import MLTreeGrowthPredictor
    print("Loading ML-based tree growth predictor...")
    predictor = MLTreeGrowthPredictor()
    print("✅ ML model loaded and ready!")
except Exception as e:
    print(f"⚠️  Could not load ML model: {e}")
    print("   Falling back to rule-based predictor...")
    from tree_growth_predictor import TreeGrowthPredictor
    predictor = TreeGrowthPredictor()
    print("✅ Rule-based model loaded!")

class PredictionHandler(BaseHTTPRequestHandler):
    """HTTP handler for prediction requests."""
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests (for health check)."""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST prediction requests."""
        if self.path != '/predict':
            self.send_response(404)
            self.end_headers()
            return
        
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Extract parameters
            tree_count = data.get('tree_count', 0)
            base_tree_count = data.get('base_tree_count', tree_count)  # Existing trees
            avg_dbh = data.get('avg_dbh', 10.0)
            years = data.get('years', 10)
            return_yearly = data.get('return_yearly', False)  # Option to return yearly breakdown
            
            # Calculate new trees planted
            new_trees = max(0, tree_count - base_tree_count)
            
            if return_yearly:
                # Return yearly predictions (for ML-based projections)
                yearly_predictions = []
                current_dbh = avg_dbh
                initial_tree_count = tree_count
                
                for year in range(1, years + 1):
                    # Predict growth for 1 year from current state
                    # Pass new_trees to get correct temperature prediction
                    tree_pred_1yr = predictor.predict_tree_impacts(current_dbh, 1, new_trees=new_trees)
                    
                    # Get growth rate and update DBH
                    growth_rate = tree_pred_1yr['predicted_dbh_cm'] - current_dbh
                    current_dbh = tree_pred_1yr['predicted_dbh_cm']
                    
                    # Calculate survival probability up to this year
                    survival_rate = predictor.predict_survival(year, avg_dbh)
                    projected_tree_count = initial_tree_count * survival_rate
                    
                    # Add new trees (they survive better since they're newly planted)
                    if new_trees > 0:
                        new_tree_survival = 0.98 ** year  # New trees have better survival
                        projected_tree_count += new_trees * new_tree_survival
                    
                    # Calculate impacts at current DBH (using size scaling)
                    size_factor = (current_dbh / 20.0) ** 1.5
                    co2_annual = 21.77 * size_factor * projected_tree_count
                    
                    # Temperature: calculate based on tree count and mortality
                    # Key: If 0 new trees, area gets HOTTER (negative change)
                    
                    if new_trees == 0:
                        # No new trees: area gets hotter due to:
                        # 1. Tree mortality (lost cooling)
                        # 2. Urban heat island effect (area warms)
                        # 3. Climate change (baseline warming)
                        
                        # Current cooling baseline
                        current_cooling_factor = (avg_dbh / 20.0) ** 2
                        current_cooling = 0.06 * current_cooling_factor * initial_tree_count
                        
                        # Future cooling (trees grow but many die)
                        future_cooling_factor = (current_dbh / 20.0) ** 2
                        surviving_trees = initial_tree_count * survival_rate
                        future_cooling = 0.06 * future_cooling_factor * surviving_trees
                        
                        # Net change from tree growth/mortality
                        temp_change_from_trees = future_cooling - current_cooling
                        
                        # Urban heat island penalty (area warms without new trees)
                        # Stronger penalty over time
                        uhi_penalty = -0.05 * year  # -0.05°F per year
                        
                        # Mortality penalty (lost trees = lost cooling = heating)
                        lost_trees = initial_tree_count * (1 - survival_rate)
                        mortality_penalty = -0.06 * 0.8 * lost_trees  # Stronger penalty
                        
                        # Climate change baseline warming (from Central Park data)
                        # Use actual warming rate from baseline data
                        warming_rate = baseline_trend['recent_slope_f_per_year']
                        climate_warming = -warming_rate * year  # Negative because it's heating
                        
                        # Total: growth benefit is usually small, penalties dominate
                        temp_annual = temp_change_from_trees + uhi_penalty + mortality_penalty + climate_warming
                        
                        # Ensure it's negative (area gets hotter)
                        if temp_annual > 0:
                            # If somehow positive, apply additional penalty
                            temp_annual = -0.1 * year  # Minimum -0.1°F per year
                    else:
                        # New trees planted: area gets cooler
                        # Current cooling from existing trees
                        current_cooling_factor = (avg_dbh / 20.0) ** 2
                        current_cooling = 0.06 * current_cooling_factor * initial_tree_count
                        
                        # Future cooling from surviving + growing trees
                        future_cooling_factor = (current_dbh / 20.0) ** 2
                        surviving_trees = initial_tree_count * survival_rate
                        future_cooling = 0.06 * future_cooling_factor * surviving_trees
                        
                        # New trees provide cooling
                        new_tree_survival = 0.98 ** year
                        new_tree_cooling_factor = (10.0 / 20.0) ** 2  # New trees start small
                        new_tree_cooling = 0.06 * new_tree_cooling_factor * (new_trees * new_tree_survival)
                        
                        temp_annual = (future_cooling - current_cooling) + new_tree_cooling
                    
                    pm25_annual = 0.18 * size_factor * projected_tree_count
                    
                    yearly_predictions.append({
                        'year': year,
                        'tree_count': projected_tree_count,
                        'avg_dbh': current_dbh,
                        'survival_rate': survival_rate,
                        'co2_annual': co2_annual,
                        'temp_annual': temp_annual,
                        'pm25_annual': pm25_annual
                    })
                
                result = {
                    'yearly_predictions': yearly_predictions,
                    'final_tree_count': yearly_predictions[-1]['tree_count'],
                    'final_avg_dbh': yearly_predictions[-1]['avg_dbh']
                }
            else:
                # Return single final prediction (backward compatible)
                tree_pred = predictor.predict_tree_impacts(avg_dbh, years, new_trees=new_trees)
                
                # Scale to tree count
                survival_rate = tree_pred['survival_probability']
                predicted_tree_count = tree_count * survival_rate
                
                co2_annual = tree_pred['co2_sequestration']['annual_rate_kg_per_year'] * predicted_tree_count
                
                # Temperature: use model prediction (can be negative)
                temp_pred = predictor.predict_temperature_reduction(avg_dbh, years, new_trees)
                temp_annual = temp_pred['annual_reduction_f'] * predicted_tree_count
                
                pm25_annual = tree_pred['pm25_reduction']['annual_reduction_lbs_per_year'] * predicted_tree_count
                
                predicted_dbh = tree_pred['predicted_dbh_cm']
                
                result = {
                    'tree_count': predicted_tree_count,
                    'avg_dbh': predicted_dbh,
                    'survival_rate': survival_rate,
                    'co2_annual': co2_annual,
                    'temp_annual': temp_annual,
                    'pm25_annual': pm25_annual
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode())
            print(f"Error: {e}", file=sys.stderr)
    
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def run_server(port=3002):
    """Run the prediction server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, PredictionHandler)
    print(f"🚀 Prediction server running on http://localhost:{port}")
    print("   Endpoints:")
    print("   - POST /predict - Get prediction")
    print("   - GET /health - Health check")
    print("\nPress Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        httpd.shutdown()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Tree growth prediction server')
    parser.add_argument('--port', type=int, default=3002, help='Port to run server on')
    args = parser.parse_args()
    run_server(args.port)
