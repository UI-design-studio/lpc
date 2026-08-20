#!/bin/bash
# LPC Spritesheet Character Generator
cd "$(dirname "$0")"

echo "====================================="
echo "  LPC Spritesheet Character Generator"
echo "====================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install:"
    echo "  brew install node"
    echo "  or visit https://nodejs.org"
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VER=$(node -v)
echo "Node.js $NODE_VER"

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo ""
    echo "First run - installing dependencies..."
    echo "(requires internet, only once)"
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Install failed. Check network."
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
    echo "Done!"
fi

# Check dist folder
if [ ! -f "dist/index.html" ]; then
    echo ""
    echo "Building production files..."
    node node_modules/vite/bin/vite.js build
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Build failed."
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
    echo "Build complete!"
fi

echo ""
echo "Starting server..."
echo "Browser will open automatically"
echo "Press Ctrl+C to stop"
echo ""

# Open browser after delay
(sleep 3 && open http://localhost:3000) &

npx serve dist -l 3000
