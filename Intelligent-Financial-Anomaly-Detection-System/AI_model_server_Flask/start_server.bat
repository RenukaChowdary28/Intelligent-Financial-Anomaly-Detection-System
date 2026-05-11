@echo off
cd /d "%~dp0"
echo Starting AegisAI Flask server with venv Python...
call env\Scripts\activate.bat
python app.py
pause
