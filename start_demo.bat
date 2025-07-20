@echo off
title Lobby Demo Startup

cls
echo.
echo ========================================
echo Multiplayer Lobby Demo - Startup Script
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "client" (
    echo ERROR: client directory not found. Please run this script from the lobby-demo directory.
    pause
    exit /b 1
)

:: Kill any existing processes
echo Cleaning up any existing processes...
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "lobby-demo-backend.exe" >nul 2>&1
taskkill /f /im "go.exe" >nul 2>&1

:: Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

:: Check if client dependencies are installed
if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    if errorlevel 1 (
        echo Failed to install client dependencies
        pause
        exit /b 1
    )
    cd ..
)

:: Check if server is built
if not exist "server\lobby-demo-backend.exe" (
    echo Building server...
    cd server
    go build -o lobby-demo-backend.exe .
    if errorlevel 1 (
        echo Failed to build server
        pause
        exit /b 1
    )
    cd ..
)

:: Start the server in background
echo Starting server...
cd server
start "Lobby Demo Server" cmd /c "lobby-demo-backend.exe"
cd ..

:: Wait a moment for server to start
timeout /t 3 /nobreak >nul

:: Start the client in background
echo Starting client...
cd client
start "Lobby Demo Client" cmd /c "npm run dev"
cd ..

:: Wait a moment for client to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Lobby Demo is starting up!
echo ========================================
echo Server: http://localhost:8080
echo Client: http://localhost:5173
echo.
echo Press any key to stop all services and cleanup...

:: Wait for user input
pause >nul

:: Cleanup
echo Cleaning up...
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "lobby-demo-backend.exe" >nul 2>&1
taskkill /f /im "go.exe" >nul 2>&1

:: Kill any remaining processes with our window titles
taskkill /f /fi "WINDOWTITLE eq Lobby Demo Server*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Lobby Demo Client*" >nul 2>&1

echo Cleanup complete!
pause 