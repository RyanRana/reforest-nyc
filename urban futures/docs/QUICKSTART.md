# Quick Start Guide

Get the NYC Climate Resilience Dashboard running in 5 steps.

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm
- Mapbox account (free tier: https://account.mapbox.com/)

## Step 1: Install Dependencies

```bash
# Run the setup script
./setup.sh

# Or manually:
pip3 install -r requirements.txt
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Step 2: Configure Mapbox Token

```bash
# Create frontend/.env file
cd frontend
cp .env.example .env

# Edit .env and add your Mapbox token:
# REACT_APP_MAPBOX_TOKEN=pk.your_token_here
# REACT_APP_API_URL=http://localhost:3001
```

Get your free token at: https://account.mapbox.com/access-tokens/

## Step 3: Prepare Data

```bash
cd python/data_pipeline
python3 prepare_zip_features.py
```

This will:
- Load all datasets
- Compute ZIP-level features
- Generate priority scores
- Save to `data/models/zip_features.parquet`

**Expected time**: 2-5 minutes

## Step 4: Train Model (Optional)

```bash
cd ../model_training
python3 train_model.py
```

This creates `data/models/impact_model.bin` with model weights.

**Note**: Currently uses synthetic training data. In production, use real impact measurements.

## Step 5: Start Services

### Terminal 1: Backend API

```bash
cd backend
npm start
```

Should see: `Server running on http://localhost:3001`

### Terminal 2: Frontend Dashboard

```bash
cd frontend
npm start
```

Browser should open to http://localhost:3000

## Verify It Works

1. **Backend Health Check**:
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test ZIP Endpoint**:
   ```bash
   curl http://localhost:3001/zip/10001
   ```
   Should return JSON with impact metrics

3. **Frontend**: Map should load with NYC ZIP codes

## Troubleshooting

### "Module not found" errors
- Make sure you ran `pip3 install -r requirements.txt`
- Check Python version: `python3 --version` (need 3.8+)

### Map doesn't load
- Check browser console for errors
- Verify Mapbox token in `frontend/.env`
- Check network tab for API calls

### Backend can't find data files
- Make sure you ran `prepare_zip_features.py` first
- Check that `data/models/zip_features.parquet` exists

### Port already in use
- Backend: Change `PORT` in `backend/.env` or kill process on 3001
- Frontend: React will prompt to use different port

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for demo walkthrough

## Development Mode

### Backend with auto-reload:
```bash
cd backend
npm run dev  # Uses ts-node for faster iteration
```

### Frontend with hot reload:
```bash
cd frontend
npm start  # Already has hot reload enabled
```

## Production Build

### Frontend:
```bash
cd frontend
npm run build
# Output in frontend/build/
```

### Backend:
```bash
cd backend
npm run build
# Output in backend/dist/
```

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review error messages in terminal/console
- Verify all data files are in place
- Ensure Mapbox token is valid

