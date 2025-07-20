@echo off
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo Multiplayer Lobby Demo - Startup Script
echo ========================================
echo.

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

:: Function to print colored output
:print_color
echo %~1%~2%~3
goto :eof

:: Check if we're in the right directory
if not exist "client" (
    call :print_color %RED% "Error: client directory not found. Please run this script from the lobby-demo directory."
    pause
    exit /b 1
)

:: Kill any existing processes
call :print_color %YELLOW% "Cleaning up any existing processes..."
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "lobby-demo-backend.exe" >nul 2>&1
taskkill /f /im "go.exe" >nul 2>&1

:: Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

:: Check if client dependencies are installed
if not exist "client\node_modules" (
    call :print_color %YELLOW% "Installing client dependencies..."
    cd client
    call npm install
    if errorlevel 1 (
        call :print_color %RED% "Failed to install client dependencies"
        pause
        exit /b 1
    )
    cd ..
)

:: Check if server is built
if not exist "server\lobby-demo-backend.exe" (
    call :print_color %YELLOW% "Building server..."
    cd server
    go build -o lobby-demo-backend.exe .
    if errorlevel 1 (
        call :print_color %RED% "Failed to build server"
        pause
        exit /b 1
    )
    cd ..
)

:: Start the server in background
call :print_color %BLUE% "Starting server..."
cd server
start "Lobby Demo Server" cmd /c "lobby-demo-backend.exe"
set SERVER_PID=%ERRORLEVEL%
cd ..

:: Wait a moment for server to start
timeout /t 3 /nobreak >nul

:: Start the client in background
call :print_color %BLUE% "Starting client..."
cd client
start "Lobby Demo Client" cmd /c "npm run dev"
set CLIENT_PID=%ERRORLEVEL%
cd ..

:: Wait a moment for client to start
timeout /t 5 /nobreak >nul

call :print_color %GREEN% "========================================"
call :print_color %GREEN% "Lobby Demo is starting up!"
call :print_color %GREEN% "========================================"
call :print_color %GREEN% "Server: http://localhost:8080"
call :print_color %GREEN% "Client: http://localhost:5173"
call :print_color %GREEN% ""
call :print_color %YELLOW% "Press any key to stop all services and cleanup..."

:: Wait for user input
pause >nul

:: Cleanup function
call :cleanup
goto :eof

:cleanup
call :print_color %YELLOW% "Cleaning up..."
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "lobby-demo-backend.exe" >nul 2>&1
taskkill /f /im "go.exe" >nul 2>&1

:: Kill any remaining processes with our window titles
taskkill /f /fi "WINDOWTITLE eq Lobby Demo Server*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Lobby Demo Client*" >nul 2>&1

call :print_color %GREEN% "Cleanup complete!"
goto :eof 