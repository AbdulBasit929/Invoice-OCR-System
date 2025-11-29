#!/bin/bash

# Invoice OCR Frontend - Quick Start Script
# This script helps you get started quickly

echo "======================================"
echo "Invoice OCR Frontend - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js >= 18.0.0 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be >= 18.0.0"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install dependencies"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and set your API URL:"
    echo "   VITE_API_URL=http://localhost:5000/api"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "To start the development server, run:"
echo ""
echo "  npm run dev"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:3000"
echo ""
echo "Default login credentials (from backend):"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "For more information, see:"
echo "  - README.md"
echo "  - DEPLOYMENT_GUIDE.md"
echo "  - COMPLETE_SETUP_GUIDE.md"
echo ""
echo "======================================"
echo "Happy coding! 🚀"
echo "======================================"