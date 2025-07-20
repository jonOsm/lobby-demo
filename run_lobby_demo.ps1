# Multiplayer Lobby Demo - Startup Script (PowerShell)
param(
    [switch]$NoCleanup
)

# Set console colors
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = $White
    )
    Write-Host $Message -ForegroundColor $Color
}

function Stop-Processes {
    Write-ColorOutput "Cleaning up any existing processes..." $Yellow
    
    # Stop Node.js processes (client)
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop Go processes (server)
    Get-Process -Name "go" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop our specific executable
    Get-Process -Name "lobby-demo-backend" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Wait for processes to fully terminate
    Start-Sleep -Seconds 2
}

function Test-Dependencies {
    # Check if we're in the right directory
    if (-not (Test-Path "client")) {
        Write-ColorOutput "Error: client directory not found. Please run this script from the lobby-demo directory." $Red
        exit 1
    }
    
    # Check if client dependencies are installed
    if (-not (Test-Path "client\node_modules")) {
        Write-ColorOutput "Installing client dependencies..." $Yellow
        Set-Location "client"
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to install client dependencies" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    # Check if server is built
    if (-not (Test-Path "server\lobby-demo-backend.exe")) {
        Write-ColorOutput "Building server..." $Yellow
        Set-Location "server"
        go build -o lobby-demo-backend.exe .
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to build server" $Red
            exit 1
        }
        Set-Location ".."
    }
}

function Start-Services {
    Write-ColorOutput "Starting server..." $Blue
    Set-Location "server"
    $serverJob = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        .\lobby-demo-backend.exe
    }
    Set-Location ".."
    
    # Wait for server to start
    Start-Sleep -Seconds 3
    
    Write-ColorOutput "Starting client..." $Blue
    Set-Location "client"
    $clientJob = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        npm run dev
    }
    Set-Location ".."
    
    # Wait for client to start
    Start-Sleep -Seconds 5
    
    return @{
        ServerJob = $serverJob
        ClientJob = $clientJob
    }
}

function Show-Status {
    Write-ColorOutput "========================================" $Green
    Write-ColorOutput "Lobby Demo is starting up!" $Green
    Write-ColorOutput "========================================" $Green
    Write-ColorOutput "Server: http://localhost:8080" $Green
    Write-ColorOutput "Client: http://localhost:5173" $Green
    Write-ColorOutput "" $Green
    Write-ColorOutput "Press Ctrl+C to stop all services and cleanup..." $Yellow
}

function Cleanup-Jobs {
    param($Jobs)
    
    Write-ColorOutput "Cleaning up..." $Yellow
    
    if ($Jobs.ServerJob) {
        Stop-Job $Jobs.ServerJob -ErrorAction SilentlyContinue
        Remove-Job $Jobs.ServerJob -ErrorAction SilentlyContinue
    }
    
    if ($Jobs.ClientJob) {
        Stop-Job $Jobs.ClientJob -ErrorAction SilentlyContinue
        Remove-Job $Jobs.ClientJob -ErrorAction SilentlyContinue
    }
    
    # Also stop any remaining processes
    Stop-Processes
    
    Write-ColorOutput "Cleanup complete!" $Green
}

# Main execution
try {
    Write-ColorOutput "========================================" $White
    Write-ColorOutput "Multiplayer Lobby Demo - Startup Script" $White
    Write-ColorOutput "========================================" $White
    
    # Cleanup existing processes
    Stop-Processes
    
    # Check and install dependencies
    Test-Dependencies
    
    # Start services
    $jobs = Start-Services
    
    # Show status
    Show-Status
    
    # Wait for user interruption
    try {
        while ($true) {
            Start-Sleep -Seconds 1
            
            # Check if jobs are still running
            if ($jobs.ServerJob.State -eq "Failed" -or $jobs.ClientJob.State -eq "Failed") {
                Write-ColorOutput "One or more services failed to start" $Red
                break
            }
        }
    }
    catch {
        # User pressed Ctrl+C or similar
        Write-ColorOutput "`nReceived interrupt signal" $Yellow
    }
}
catch {
    Write-ColorOutput "An error occurred: $($_.Exception.Message)" $Red
}
finally {
    if (-not $NoCleanup) {
        Cleanup-Jobs $jobs
    }
} 