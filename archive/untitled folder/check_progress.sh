#!/bin/bash
# Check progress of map data generation

echo "🗺️  NYC Map Generation Progress"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ -f "map_data.json" ]; then
    echo "✅ map_data.json exists"
    
    # Count hexes generated so far
    hex_count=$(grep -c '"hex_id"' map_data.json 2>/dev/null || echo "0")
    echo "📍 Hexagons generated: $hex_count"
    
    # Show file size
    file_size=$(ls -lh map_data.json | awk '{print $5}')
    echo "📦 File size: $file_size"
    
    echo ""
    echo "Total expected: ~10,302 hexagons for full NYC"
    
    if [ "$hex_count" -gt 0 ]; then
        progress=$((hex_count * 100 / 10302))
        echo "Progress: ${progress}%"
    fi
else
    echo "⏳ map_data.json not created yet..."
    echo "Generation in progress..."
fi

echo ""
echo "════════════════════════════════════════════════════════════"
