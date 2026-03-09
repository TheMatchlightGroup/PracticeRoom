#!/bin/bash

# VocalStudy Music Analysis Setup Script
# Helps developers quickly set up the Python microservice

set -e

echo "🎵 VocalStudy Music Analysis Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}❌ Python 3 not found!${NC}"
    echo "Please install Python 3.11+ from https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION}${NC}"
echo ""

# Navigate to service directory
SERVICE_DIR="services/music-analysis"

if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${YELLOW}Error: $SERVICE_DIR not found!${NC}"
    exit 1
fi

cd "$SERVICE_DIR"
echo -e "${BLUE}Working in: $(pwd)${NC}"
echo ""

# Create venv
echo -e "${BLUE}Creating Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi
echo ""

# Activate venv
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install --upgrade pip setuptools wheel > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Verify music21
echo -e "${BLUE}Verifying music21 installation...${NC}"
python3 -c "import music21; print(f'music21 version: {music21.__version__}')" 2>/dev/null && echo -e "${GREEN}✓ music21 is working${NC}" || echo -e "${YELLOW}⚠ music21 may require additional setup${NC}"
echo ""

# Test import
echo -e "${BLUE}Testing FastAPI...${NC}"
python3 -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')" > /dev/null 2>&1 && echo -e "${GREEN}✓ FastAPI is working${NC}" || (echo -e "${YELLOW}Error installing FastAPI${NC}" && exit 1)
echo ""

# Done
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Activate venv: cd services/music-analysis && source venv/bin/activate"
echo "2. Run service: python app.py"
echo "3. Test endpoint: curl http://localhost:8001/health"
echo ""
echo "For more information, see: services/music-analysis/README.md"
