#!/bin/bash

# NYC Climate Resilience Spatial Simulation - Setup Script

set -e

echo "🌳 NYC Climate Resilience Spatial Simulation - Setup"
echo "=================================================="
echo ""

# Check Python
echo "📦 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check Node.js
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt
echo "✅ Python dependencies installed"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✅ Frontend dependencies installed"

# Check for Mapbox token
echo ""
echo "🔑 Checking Mapbox configuration..."
if [ ! -f "frontend/.env" ]; then
    echo "⚠️  frontend/.env not found. Creating from example..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please edit frontend/.env and add your Mapbox token"
    echo "   Get a free token at: https://account.mapbox.com/access-tokens/"
else
    echo "✅ frontend/.env found"
fi

# Create data/models directory if it doesn't exist
mkdir -p data/models

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your Mapbox token to frontend/.env"
echo "2. Run data preparation: cd python/data_pipeline && python3 prepare_zip_features.py"
echo "3. Train model: cd python/model_training && python3 train_model.py"
echo "4. Start backend: cd backend && npm start"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "For detailed instructions, see README.md"

