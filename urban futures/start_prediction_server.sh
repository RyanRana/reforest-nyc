#!/bin/bash
# Start the fast prediction server

cd "$(dirname "$0")"
cd python/model_training

echo "Starting prediction server..."
python3 prediction_server.py --port 3002
