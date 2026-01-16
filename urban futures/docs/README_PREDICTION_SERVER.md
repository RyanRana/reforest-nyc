# Fast Prediction Server

## Why It's Slow Without This

The site was slow because:
1. **Every slider change** triggered a new API call
2. **Each API call** spawned a new Python process (1-2 seconds)
3. **Each Python process** loaded the pickle model from disk
4. **No caching** - same calculations repeated

## Solution: Persistent Python Server

A Python HTTP server that:
- ✅ **Loads model once** at startup (stays in memory)
- ✅ **Responds in <50ms** instead of 1-2 seconds
- ✅ **Handles multiple requests** without reloading
- ✅ **No process spawning overhead**

## Quick Start

### Start the Prediction Server

```bash
cd urban\ futures
python3 python/model_training/prediction_server.py --port 3002
```

Or use the script:
```bash
./start_prediction_server.sh
```

### The Backend Will Auto-Detect It

The backend automatically:
1. Tries the fast server first (port 3002)
2. Falls back to direct Python call if server unavailable
3. Uses debouncing (300ms) to avoid too many requests

## Performance

**Before (direct Python calls):**
- 1-2 seconds per prediction
- New process each time
- Slow slider interaction

**After (persistent server):**
- <50ms per prediction
- Model stays in memory
- Smooth slider interaction

## Running in Production

1. Start prediction server as a service:
```bash
nohup python3 python/model_training/prediction_server.py --port 3002 &
```

2. Or use systemd/supervisor to keep it running

3. Backend will automatically use it when available
