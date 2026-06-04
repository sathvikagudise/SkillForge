@echo off
cd /d "C:\Users\sathv\Downloads\Creations\cmlp-portal-main (1)\cmlp-portal-main\backend"
start /B /D "C:\Users\sathv\Downloads\Creations\cmlp-portal-main (1)\cmlp-portal-main\backend" "C:\Users\sathv\Downloads\Creations\cmlp-portal-main (1)\cmlp-portal-main\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level error
