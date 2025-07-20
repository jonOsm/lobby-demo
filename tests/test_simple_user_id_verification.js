const WebSocket = require('ws');

console.log('🧪 Simple User ID System Verification...\n');

// Test 1: User Registration
async function testUserRegistration() {
  console.log('📝 Test 1: User Registration');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve) => {
    ws.on('open', () => {
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'TestUser1'
      }));
    });
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Received:', response);
      
      if (response.action === 'user_registered') {
        console.log('✅ User registration successful');
        console.log('🆔 User ID:', response.user_id);
        console.log('👤 Username:', response.username);
        ws.close();
        resolve({ success: true, userId: response.user_id, username: response.username });
      } else if (response.action === 'error') {
        console.log('❌ User registration failed:', response.message);
        ws.close();
        resolve({ success: false, error: response.message });
      }
    });
    
    ws.on('error', (err) => {
      console.log('❌ Connection error:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

// Test 2: Username Uniqueness
async function testUsernameUniqueness() {
  console.log('\n📝 Test 2: Username Uniqueness');
  
  const ws1 = new WebSocket('ws://localhost:8080/ws');
  const ws2 = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve) => {
    let firstRegistered = false;
    let secondAttempted = false;
    
    ws1.on('open', () => {
      ws1.send(JSON.stringify({
        action: 'register_user',
        username: 'UniqueUser'
      }));
    });
    
    ws2.on('open', () => {
      // Wait a bit for first registration
      setTimeout(() => {
        ws2.send(JSON.stringify({
          action: 'register_user',
          username: 'UniqueUser' // Same username
        }));
        secondAttempted = true;
      }, 100);
    });
    
    ws1.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 User 1 received:', response);
      
      if (response.action === 'user_registered') {
        console.log('✅ First user registered successfully');
        firstRegistered = true;
        ws1.close();
      }
    });
    
    ws2.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 User 2 received:', response);
      
      if (response.action === 'error' && response.message === 'username already taken') {
        console.log('✅ Username uniqueness enforced correctly');
        ws2.close();
        resolve({ success: true });
      } else if (response.action === 'user_registered') {
        console.log('❌ Duplicate username was allowed');
        ws2.close();
        resolve({ success: false, error: 'Duplicate username allowed' });
      }
    });
    
    // Timeout to ensure we don't hang
    setTimeout(() => {
      if (firstRegistered && secondAttempted) {
        ws1.close();
        ws2.close();
        resolve({ success: false, error: 'Timeout waiting for uniqueness test' });
      }
    }, 2000);
  });
}

// Test 3: Lobby Creation with User ID
async function testLobbyCreation() {
  console.log('\n📝 Test 3: Lobby Creation with User ID');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  let userId = null;
  
  return new Promise((resolve) => {
    ws.on('open', () => {
      // First register
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'LobbyCreator'
      }));
    });
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Received:', response);
      
      if (response.action === 'user_registered') {
        userId = response.user_id;
        console.log('✅ User registered, creating lobby...');
        
        // Then create lobby
        ws.send(JSON.stringify({
          action: 'create_lobby',
          name: 'TestLobby',
          max_players: 4,
          public: true
        }));
      } else if (response.action === 'lobby_created') {
        console.log('✅ Lobby created successfully');
        console.log('🏠 Lobby ID:', response.lobby_id);
        ws.close();
        resolve({ success: true, lobbyId: response.lobby_id, userId });
      } else if (response.action === 'error') {
        console.log('❌ Error:', response.message);
        ws.close();
        resolve({ success: false, error: response.message });
      }
    });
    
    ws.on('error', (err) => {
      console.log('❌ Connection error:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

// Test 4: Join Lobby with User ID
async function testLobbyJoining(lobbyId, userId) {
  console.log('\n📝 Test 4: Join Lobby with User ID');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  let joinerUserId = null;
  
  return new Promise((resolve) => {
    ws.on('open', () => {
      // First register
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'LobbyJoiner'
      }));
    });
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Received:', response);
      
      if (response.action === 'user_registered') {
        joinerUserId = response.user_id;
        console.log('✅ User registered, joining lobby...');
        
        // Then join lobby
        ws.send(JSON.stringify({
          action: 'join_lobby',
          lobby_id: lobbyId,
          user_id: response.user_id
        }));
      } else if (response.action === 'lobby_state') {
        // Check if the joiner is in the lobby
        const playerInLobby = response.players.some(p => p.user_id === joinerUserId);
        if (playerInLobby) {
          console.log('✅ Successfully joined lobby with user ID');
          console.log('👥 Players in lobby:', response.players.length);
          ws.close();
          resolve({ success: true });
        } else {
          console.log('❌ User not found in lobby');
          console.log('Expected user ID:', joinerUserId);
          console.log('Available players:', response.players.map(p => ({ user_id: p.user_id, username: p.username })));
          ws.close();
          resolve({ success: false, error: 'User not in lobby' });
        }
      } else if (response.action === 'error') {
        console.log('❌ Error:', response.message);
        ws.close();
        resolve({ success: false, error: response.message });
      }
    });
    
    ws.on('error', (err) => {
      console.log('❌ Connection error:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting User ID System Tests...\n');
  
  const results = [];
  
  // Test 1: User Registration
  const regResult = await testUserRegistration();
  results.push({ test: 'User Registration', ...regResult });
  
  // Test 2: Username Uniqueness
  const uniqueResult = await testUsernameUniqueness();
  results.push({ test: 'Username Uniqueness', ...uniqueResult });
  
  // Test 3: Lobby Creation
  const lobbyResult = await testLobbyCreation();
  results.push({ test: 'Lobby Creation', ...lobbyResult });
  
  // Test 4: Lobby Joining (if lobby creation succeeded)
  if (lobbyResult.success) {
    const joinResult = await testLobbyJoining(lobbyResult.lobbyId, lobbyResult.userId);
    results.push({ test: 'Lobby Joining', ...joinResult });
  }
  
  // Print results
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.test}: ${status}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! User ID system is working correctly!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runTests(); 