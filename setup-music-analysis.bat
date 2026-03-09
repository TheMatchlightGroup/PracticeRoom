@echo off
REM VocalStudy Music Analysis Setup Script for Windows
REM Helps developers quickly set up the Python microservice

setlocal enabledelayedexpansion

echo.
echo 🎵 VocalStudy Music Analysis Setup (Windows)
echo =============================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 3 not found!
    echo Please install Python 3.11+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ %PYTHON_VERSION%
echo.

REM Navigate to service directory
set SERVICE_DIR=services\music-analysis

if not exist "%SERVICE_DIR%" (
    echo Error: %SERVICE_DIR% not found!
    pause
    exit /b 1
)

cd /d "%SERVICE_DIR%"
echo Working in: %cd%
echo.

REM Create venv
echo Creating Python virtual environment...
if not exist "venv" (
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip setuptools wheel >nul 2>&1
pip install -r requirements.txt
echo ✓ Dependencies installed
echo.

REM Verify music21
echo Verifying music21 installation...
python -c "import music21; print(f'music21 version: {music21.__version__}')" 2>nul
if errorlevel 0 (
    echo ✓ music21 is working
) else (
    echo ⚠ music21 may require additional setup
)
echo.

REM Test FastAPI
echo Testing FastAPI...
python -c "import fastapi; print(f'FastAPI version: {fastapi.__version__}')" >nul 2>&1
if errorlevel 0 (
    echo ✓ FastAPI is working
) else (
    echo ❌ Error installing FastAPI
    pause
    exit /b 1
)
echo.

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Activate venv: cd services\music-analysis ^&^& venv\Scripts\activate.bat
echo 2. Run service: python app.py
echo 3. Test endpoint: curl http://localhost:8001/health
echo.
echo For more information, see: services\music-analysis\README.md
echo.
pause
