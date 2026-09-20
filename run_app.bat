@echo off
title Drone Wildlife Monitoring - YOLO11s
echo ======================================================================
echo  Starting Drone-Based Wildlife Monitoring Server (YOLO11s)...
echo  Website will open automatically at: http://127.0.0.1:5000
echo ======================================================================
cd /d "%~dp0"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:5000
python app.py
pause
