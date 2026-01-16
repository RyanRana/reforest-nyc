#!/usr/bin/env python3
"""
AI-based prediction server using NVIDIA Earth-2 and ML models.

Provides AI-enhanced predictions for:
- Temperature reduction (using Earth-2 climate models)
- CO2 sequestration (AI-learned from climate conditions)
- Multi-year projections with climate change
"""

import json
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "python" / "model_training"))

from earth2_ai_predictor import Earth2AIPredictor
from ml_tree_growth_predictor import MLTreeGrowthPredictor

# Initialize AI predictors
print("Initializing AI prediction system...")
earth2_predictor = Earth2AIPredictor()
tree_predictor = MLTreeGrowthPredictor()
print("✅ AI predictors ready!")


class AIPredictionHandler(BaseHTTPRequestHandler):
    """HTTP handler for AI prediction requests."""
    
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle health check."""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'ai_enabled': True}).encode())
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
            base_tree_count = data.get('base_tree_count', tree_count)
            avg_dbh = data.get('avg_dbh', 10.0)
            years = data.get('years', 10)
            return_yearly = data.get('return_yearly', False)
            
            # Get location (if provided)
            lat = data.get('lat', 40.7128)  # NYC default
            lon = data.get('lon', -74.0060)
            
            new_trees = max(0, tree_count - base_tree_count)
            
            if return_yearly:
                # Return yearly AI predictions
                yearly_predictions = []
                current_dbh = avg_dbh
                initial_tree_count = base_tree_count
                
                # Get baseline temperature predictions (AI)
                baseline_temps = earth2_predictor.predict_baseline_temperature(lat, lon, years)
                
                # Get temperature with trees (AI)
                temp_with_trees = earth2_predictor.predict_temperature_with_trees(
                    lat, lon, tree_count, avg_dbh, years, new_trees
                )
                
                # Get CO2 predictions (AI)
                co2_predictions = earth2_predictor.predict_co2_sequestration_ai(
                    tree_count, avg_dbh, years
                )
                
                cumulative_co2 = 0
                cumulative_temp_reduction = 0
                
                for year in range(1, years + 1):
                    year_key = f"year_{year}"
                    
                    # Tree growth
                    growth_rate = tree_predictor.predict_dbh(current_dbh, 1)
                    current_dbh = growth_rate
                    survival_rate = tree_predictor.predict_survival(year, avg_dbh)
                    projected_tree_count = initial_tree_count * survival_rate
                    if new_trees > 0:
                        new_tree_survival = 0.98 ** year
                        projected_tree_count += new_trees * new_tree_survival
                    
                    # Temperature (AI)
                    if year_key in temp_with_trees:
                        temp_data = temp_with_trees[year_key]
                        temp_reduction = temp_data['tree_cooling_f']
                    else:
                        # Fallback calculation
                        canopy_factor = (current_dbh / 20.0) ** 2
                        temp_reduction = 0.06 * canopy_factor * projected_tree_count
                    
                    # CO2 (AI)
                    if year_key in co2_predictions['yearly']:
                        co2_data = co2_predictions['yearly'][year_key]
                        co2_annual = co2_data['annual_kg']
                    else:
                        # Fallback
                        dbh_factor = (current_dbh / 20.0) ** 1.5
                        co2_annual = 21.77 * dbh_factor * projected_tree_count
                    
                    # PM2.5 (standard calculation)
                    pm25_annual = 0.18 * (current_dbh / 20.0) ** 1.5 * projected_tree_count
                    
                    cumulative_co2 += co2_annual
                    cumulative_temp_reduction += temp_reduction
                    
                    yearly_predictions.append({
                        'year': year,
                        'tree_count': projected_tree_count,
                        'avg_dbh': current_dbh,
                        'survival_rate': survival_rate,
                        'co2_annual': co2_annual,
                        'temp_annual': temp_reduction,
                        'pm25_annual': pm25_annual
                    })
                
                result = {
                    'yearly_predictions': yearly_predictions,
                    'final_tree_count': yearly_predictions[-1]['tree_count'],
                    'final_avg_dbh': yearly_predictions[-1]['avg_dbh'],
                    'total_co2_kg': cumulative_co2,
                    'total_co2_metric_tons': cumulative_co2 / 1000,
                    'avg_temp_reduction_f': cumulative_temp_reduction / years
                }
            else:
                # Single final prediction
                temp_predictions = earth2_predictor.predict_temperature_with_trees(
                    lat, lon, tree_count, avg_dbh, years, new_trees
                )
                co2_predictions = earth2_predictor.predict_co2_sequestration_ai(
                    tree_count, avg_dbh, years
                )
                
                final_year_key = f"year_{years}"
                temp_reduction = temp_predictions.get(final_year_key, {}).get('tree_cooling_f', 0)
                co2_total = co2_predictions['total_metric_tons']
                
                result = {
                    'tree_count': tree_count,
                    'avg_dbh': avg_dbh,
                    'temperature_reduction_f': temp_reduction,
                    'co2_sequestration_metric_tons': co2_total
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


def main():
    """Run AI prediction server."""
    port = 3003  # Different port from regular prediction server
    server = HTTPServer(('localhost', port), AIPredictionHandler)
    print(f"🚀 AI Prediction Server running on http://localhost:{port}")
    print("   Using NVIDIA Earth-2 AI models for climate predictions")
    print("   Using ML models for tree growth and impacts")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down AI prediction server...")
        server.shutdown()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=3003)
    args = parser.parse_args()
    
    port = args.port
    server = HTTPServer(('localhost', port), AIPredictionHandler)
    print(f"🚀 AI Prediction Server running on http://localhost:{port}")
    print("   Using NVIDIA Earth-2 AI models for climate predictions")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
