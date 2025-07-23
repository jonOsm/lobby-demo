# Ready Up - Multiplayer Lobby Demo

A real-time multiplayer lobby system with a React frontend and Go backend.

## Project Structure

```
lobby-demo/
├── client/                 # React frontend application
├── server/                 # Go backend server
├── tests/                  # Test scripts for the application
├── run_lobby_demo.bat      # Windows batch script to start the demo
├── run_lobby_demo.ps1      # PowerShell script to start the demo
├── RUN_SCRIPTS_README.md   # Documentation for the startup scripts
├── package.json            # Node.js dependencies for tests
└── package-lock.json       # Lock file for Node.js dependencies
```

## Quick Start

### Option 1: Batch Script (Simple)
```cmd
cd lobby-demo
run_lobby_demo.bat
```

### Option 2: PowerShell Script (Recommended)
```powershell
cd lobby-demo
.\run_lobby_demo.ps1
```

This will:
1. Install client dependencies if needed
2. Build the server if needed
3. Start both client and server
4. Open the application in your browser

## Manual Setup

### Prerequisites
- Node.js (for client and tests)
- Go (for server)

### Client Setup
```cmd
cd lobby-demo/client
npm install
npm run dev
```

### Server Setup
```cmd
cd lobby-demo/server
go mod tidy
go build -o lobby-demo-backend.exe .
./lobby-demo-backend.exe
```

## Testing

The `tests/` directory contains various test scripts to verify functionality:

```cmd
cd lobby-demo/tests
node simple_test.js
```

See `tests/README.md` for detailed information about available tests.

## Features

- **Real-time WebSocket communication**
- **User registration and management**
- **Lobby creation and management**
- **Player ready status**
- **Game state management**
- **Username uniqueness enforcement**

## Architecture

- **Frontend**: React with TypeScript, Vite, Tailwind CSS
- **Backend**: Go with Gorilla WebSocket
- **Communication**: WebSocket protocol
- **Testing**: Node.js with ws library

## Development

### Adding New Features
1. Start the demo using the provided scripts
2. Make changes to client or server code
3. Client changes will hot-reload automatically
4. Server changes require restart
5. Test your changes using the test scripts

### Testing New Features
1. Create a new test file in `tests/`
2. Follow the naming convention `test_*.js`
3. Include clear console output with emojis
4. Update `tests/README.md` with a description

## Troubleshooting

### Port Conflicts
If you get port conflicts, the startup scripts will automatically clean up existing processes.

### Build Errors
- Check that Go is installed and in PATH
- Verify all Go dependencies are available
- Check the `go.mod` file in `server/`

### Client Issues
- Check that Node.js is installed
- Verify `package.json` exists in `client/`
- Try running `npm install` manually

## API Documentation

The WebSocket API supports the following actions:

- `register_user` - Register a new user
- `create_lobby` - Create a new lobby
- `join_lobby` - Join an existing lobby
- `leave_lobby` - Leave a lobby
- `set_ready` - Set player ready status
- `start_game` - Start the game
- `list_lobbies` - List available lobbies

See the test files in `tests/` for example usage of each action. 