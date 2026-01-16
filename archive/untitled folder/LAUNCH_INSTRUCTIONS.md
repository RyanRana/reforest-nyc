# 🚀 Launch Instructions for Interactive Map

## The Problem

You saw this error:
```
Error loading data. Please run generate_map_data.py first.
```

**Why?** Browsers block loading local JSON files when you open HTML directly (security feature called CORS).

**Solution:** Use a local web server!

## ✅ Quick Launch (3 Methods)

### Method 1: One-Line Launch (Recommended)
```bash
cd "/Users/ryanrana/Desktop/untitled folder" && python3 -m http.server 8000
```

Then open: **http://localhost:8000**

### Method 2: Use Launch Script
```bash
./launch_map.sh
```

Automatically opens browser to http://localhost:8000

### Method 3: Alternative Server
```bash
# If you have Node.js
npx http-server -p 8000

# Or with PHP
php -S localhost:8000
```

## 📖 Step-by-Step

### 1. Open Terminal

### 2. Navigate to Project
```bash
cd "/Users/ryanrana/Desktop/untitled folder"
```

### 3. Start Server
```bash
python3 -m http.server 8000
```

You'll see:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### 4. Open Browser
Go to: **http://localhost:8000**

### 5. Use the Map!
- Click hexagons to see data
- Use slider to add trees
- See temperature predictions in real-time

### 6. Stop Server (When Done)
Press `Ctrl+C` in the terminal

## 🎯 What You Should See

```
┌─────────────────────────────────────────────────────────┐
│         NYC Temperature Map (Now Working!)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Interactive hex grid with colors                       │
│  Click any hex → Info panel appears →                   │
│  Use slider to add trees → See new temperature         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Troubleshooting

### "Port 8000 already in use"
Try a different port:
```bash
python3 -m http.server 8001
# Then open: http://localhost:8001
```

### Still seeing error?
1. Check files exist:
```bash
ls -la index.html map_data.json
```

2. Regenerate data:
```bash
python generate_map_data.py --min_lat 40.75 --max_lat 40.77 --min_lon -74.01 --max_lon -73.99
```

3. Verify JSON is valid:
```bash
python3 -c "import json; json.load(open('map_data.json'))"
```

### Map loads but no hexagons?
Check if data was generated:
```bash
cat map_data.json | grep -c "hex_id"
```

Should show at least 50 hex entries.

## 💡 Pro Tips

### Generate Data for Different Areas

**Times Square:**
```bash
python generate_map_data.py --min_lat 40.755 --max_lat 40.760 --min_lon -73.990 --max_lon -73.980
```

**Central Park:**
```bash
python generate_map_data.py --min_lat 40.764 --max_lat 40.800 --min_lon -73.982 --max_lon -73.949
```

**Custom Area:**
```bash
python generate_map_data.py \
  --min_lat 40.XX \
  --max_lat 40.YY \
  --min_lon -74.XX \
  --max_lon -73.YY
```

Then refresh browser to see new data!

## 🌐 Access from Other Devices

### On Your Network
```bash
# Start server on all interfaces
python3 -m http.server 8000 --bind 0.0.0.0
```

Then find your IP:
```bash
ipconfig getifaddr en0  # Mac WiFi
# or
ipconfig getifaddr en1  # Mac Ethernet
```

Access from phone/tablet: `http://YOUR_IP:8000`

## 📱 Mobile Access

The map works great on mobile!
1. Start server (method above)
2. Open `http://YOUR_IP:8000` on phone
3. Tap hexagons, use slider

## ⚡ Quick Reference

```bash
# Full workflow:
cd "/Users/ryanrana/Desktop/untitled folder"
python generate_map_data.py --min_lat 40.75 --max_lat 40.77 --min_lon -74.01 --max_lon -73.99
python3 -m http.server 8000
# Open http://localhost:8000
```

## 🎉 You're All Set!

Your map should now be:
- ✅ Loading properly
- ✅ Showing colored hexagons
- ✅ Interactive (clickable)
- ✅ Real-time tree simulator working

Enjoy exploring NYC temperatures! 🌳🗽
