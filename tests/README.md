# Lobby Demo Tests

This directory contains various test scripts for the multiplayer lobby demo application.

## Test Files Overview

### Basic Tests
- **`simple_test.js`** - Basic server connection test
- **`test_simple.js`** - Simple WebSocket connection and lobby listing test

### User ID System Tests
- **`test_user_id_system.js`** - Tests the new user ID system implementation
- **`test_simple_user_id_verification.js`** - Comprehensive user ID system verification
- **`test_complete_user_id_system.js`** - Complete end-to-end user ID system testing
- **`test_debug_user_id.js`** - Debugging script for user ID system issues

### Username Management Tests
- **`test_username_uniqueness.js`** - Tests username uniqueness enforcement
- **`test_username_uniqueness_fixed.js`** - Fixed version of username uniqueness testing

### Lobby Management Tests
- **`test_auto_join.js`** - Tests auto-join functionality after lobby creation
- **`test_fixed_auto_join.js`** - Fixed version of auto-join testing
- **`test_leave_lobby.js`** - Tests lobby leaving functionality
- **`test_lobby_deletion.js`** - Tests lobby deletion when last player leaves
- **`test_user_flow.js`** - Tests complete user flow from registration to game

### Web Interface Tests
- **`test_web_interface_simulation.js`** - Simulates web interface behavior

## Running Tests

### Prerequisites
1. Make sure the lobby demo is running:
   ```cmd
   cd lobby-demo
   run_lobby_demo.bat
   ```

2. Install test dependencies:
   ```cmd
   cd lobby-demo
   npm install
   ```

### Running Individual Tests
```cmd
cd lobby-demo/tests
node test_name.js
```

### Running All Tests
You can run multiple tests in sequence:
```cmd
cd lobby-demo/tests
node simple_test.js
node test_user_id_system.js
node test_username_uniqueness.js
# ... etc
```

## Test Categories

### 🔧 Basic Connectivity
- `simple_test.js` - Verifies server is running and responding
- `test_simple.js` - Basic WebSocket communication
- `test_user_registration_fix.js` - Tests user registration and auto-reconnect fixes

### 👤 User Management
- `test_user_id_system.js` - User registration and ID assignment
- `test_username_uniqueness.js` - Username collision handling
- `test_simple_user_id_verification.js` - Complete user ID workflow

### 🏠 Lobby Operations
- `test_auto_join.js` - Auto-join after lobby creation
- `test_leave_lobby.js` - Lobby leaving and cleanup
- `test_lobby_deletion.js` - Lobby deletion when empty

### 🔄 Complete Workflows
- `test_user_flow.js` - End-to-end user experience
- `test_complete_user_id_system.js` - Full system integration test

## Test Output

Most tests provide colored console output with emojis for easy reading:
- ✅ Success indicators
- ❌ Error indicators
- 📨 Message received indicators
- 🔄 Process indicators

## Debugging

If tests fail:
1. Check that the server is running on `localhost:8080`
2. Verify the client is running on `localhost:5173`
3. Check server logs for errors
4. Use `test_debug_user_id.js` for detailed debugging

## Adding New Tests

When adding new tests:
1. Follow the naming convention: `test_*.js`
2. Include clear console output with emojis
3. Test one specific functionality per file
4. Include error handling and cleanup
5. Update this README with a description 