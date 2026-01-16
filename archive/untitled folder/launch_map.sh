#!/bin/bash
# Launch the interactive map with a local web server

echo "🗺️  Launching NYC Temperature Map..."
echo ""
echo "Starting web server on http://localhost:8000"
echo ""
echo "✅ Open your browser to: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "═══════════════════════════════════════════════════════════"

python3 -m http.server 8000
