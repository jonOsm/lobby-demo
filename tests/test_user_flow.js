const WebSocket = require('ws');

console.log('🧪 Testing Complete User Flow...\n');

async function testCompleteFlow() {
  console.log('📝 Step 1: Registering user...');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve) => {
    let userId = null;
    let username = null;
    let lobbyId = null;
    
    ws.on('open', () => {
      console.log('✅ Connected to WebSocket');
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'TestUser'
      }));
    });
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Received:', response);
      
      if (response.action === 'user_registered') {
        console.log('✅ User registered successfully!');
        userId = response.user_id;
        username = response.username;
        
        // Step 2: Create lobby
        console.log('\n📝 Step 2: Creating lobby...');
        ws.send(JSON.stringify({
          action: 'create_lobby',
          name: 'TestFlowLobby' + Date.now(),
          max_players: 4,
          public: true,
          user_id: userId
        }));
      } else if (response.action === 'lobby_created') {
        console.log('✅ Lobby created successfully!');
        lobbyId = response.lobby_id;
        
        // Step 3: Join lobby (auto-join should happen)
        console.log('\n📝 Step 3: Auto-joining lobby...');
        // The auto-join should happen automatically after lobby creation
      } else if (response.action === 'lobby_state') {
        console.log('✅ Lobby state received');
        const playerInLobby = response.players.some(p => p.user_id === userId);
        
        if (playerInLobby) {
          console.log('✅ Successfully in lobby!');
          console.log('👥 Players in lobby:', response.players.length);
          console.log('🎮 Lobby ready for game!');
          ws.close();
          resolve({ success: true, lobbyId, userId, username });
        } else {
          console.log('❌ User not found in lobby');
          console.log('Expected user ID:', userId);
          console.log('Available players:', response.players.map(p => ({ user_id: p.user_id, username: p.username })));
          ws.close();
          resolve({ success: false, error: 'User not in lobby' });
        }
      } else if (response.action === 'error') {
        console.log('❌ Error received:', response.message);
        ws.close();
        resolve({ success: false, error: response.message });
      }
    });
    
    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err);
      resolve({ success: false, error: err.message });
    });
    
    // Timeout
    setTimeout(() => {
      console.log('⚠️ Test timeout');
      ws.close();
      resolve({ success: false, error: 'Timeout' });
    }, 10000);
  });
}

// Run the test
testCompleteFlow().then(result => {
  console.log('\n📊 TEST RESULT:');
  console.log('================');
  if (result.success) {
    console.log('🎉 SUCCESS: Complete user flow works!');
    console.log('🏠 Lobby ID:', result.lobbyId);
    console.log('👤 User ID:', result.userId);
    console.log('📝 Username:', result.username);
  } else {
    console.log('❌ FAILED:', result.error);
  }
}); 