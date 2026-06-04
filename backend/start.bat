@echo off
cd /d "%~dp0"
start /B venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level error
