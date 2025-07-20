# Multiplayer Lobby Demo - Startup Scripts

This directory contains scripts to easily start and stop the multiplayer lobby demo application.

**Note: These scripts should be run from within the `lobby-demo` directory.**

## Available Scripts

### 1. `run_lobby_demo.bat` (Windows Batch)
A traditional Windows batch script that:
- Cleans up any existing processes
- Installs client dependencies if needed
- Builds the server if needed
- Starts both client and server in separate windows
- Provides cleanup on exit

### 2. `run_lobby_demo.ps1` (PowerShell)
A modern PowerShell script with better process management:
- More robust process cleanup
- Better error handling
- Background job management
- Cleaner output with colors

## Usage

### Option 1: Batch Script (Recommended for simple use)
```cmd
cd lobby-demo
run_lobby_demo.bat
```

### Option 2: PowerShell Script (Recommended for development)
```powershell
cd lobby-demo
# Run with cleanup (default)
.\run_lobby_demo.ps1

# Run without automatic cleanup (useful for debugging)
.\run_lobby_demo.ps1 -NoCleanup
```

## What the Scripts Do

1. **Cleanup**: Kill any existing Node.js, Go, or lobby-demo processes
2. **Dependency Check**: 
   - Install client dependencies (`npm install`) if `node_modules` doesn't exist
   - Build server (`go build`) if executable doesn't exist
3. **Start Services**:
   - Start the Go server on `http://localhost:8080`
   - Start the React client on `http://localhost:5173`
4. **Wait for User**: Keep services running until user interrupts
5. **Cleanup**: Stop all services and clean up processes

## Manual Cleanup

If you need to manually stop the services:

```cmd
# Kill all Node.js processes (client)
taskkill /f /im node.exe

# Kill the server executable
taskkill /f /im lobby-demo-backend.exe

# Or use PowerShell
Get-Process -Name "node" | Stop-Process -Force
Get-Process -Name "lobby-demo-backend" | Stop-Process -Force
```

## Development Workflow

1. **Start Development**: 
   ```cmd
   cd lobby-demo
   run_lobby_demo.ps1  # or run_lobby_demo.bat
   ```
2. **Make Changes**: Edit code in `client/` or `server/` directories
3. **Test Changes**: The client will hot-reload automatically, server needs restart
4. **Stop Development**: Press `Ctrl+C` (PowerShell) or any key (Batch) to stop

## Troubleshooting

### Port Already in Use
If you get port conflicts:
1. Stop the script with `Ctrl+C`
2. Wait for cleanup to complete
3. Run the script again

### Build Errors
If the server fails to build:
1. Check that Go is installed and in PATH
2. Verify all Go dependencies are available
3. Check the `go.mod` file in `lobby-demo/server/`

### Client Dependencies
If the client fails to start:
1. Check that Node.js is installed
2. Verify `package.json` exists in `lobby-demo/client/`
3. Try running `npm install` manually in the client directory

## Notes

- The scripts assume you're running from within the `lobby-demo` directory
- Both scripts will automatically install dependencies and build the server if needed
- The PowerShell script provides better process management and error handling
- Use the `-NoCleanup` flag with PowerShell if you want to keep processes running for debugging 