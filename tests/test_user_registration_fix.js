const WebSocket = require('ws');

console.log('🧪 Testing User Registration Fix');
console.log('================================');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', () => {
  console.log('✅ WebSocket connected');
  
  // Test 1: Register a user
  console.log('\n📝 Test 1: Registering user "testuser"');
  ws.send(JSON.stringify({
    action: 'register_user',
    username: 'testuser'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  if (message.action === 'user_registered') {
    console.log('✅ User registration successful!');
    console.log(`   User ID: ${message.user_id}`);
    console.log(`   Username: ${message.username}`);
    
    // Store the user ID for later use
    global.userId = message.user_id;
    
    // Test 2: List lobbies
    console.log('\n📋 Test 2: Listing lobbies');
    ws.send(JSON.stringify({
      action: 'list_lobbies'
    }));
    
  } else if (message.action === 'lobby_list') {
    console.log('✅ Lobby list received successfully!');
    console.log(`   Lobbies: ${message.lobbies.length}`);
    
    // Test 3: Create a lobby
    console.log('\n🏠 Test 3: Creating a test lobby');
    ws.send(JSON.stringify({
      action: 'create_lobby',
      name: 'Test Lobby',
      max_players: 4,
      public: true,
      user_id: global.userId // Use the stored user ID
    }));
    
  } else if (message.action === 'lobby_state') {
    console.log('✅ Lobby created successfully!');
    console.log(`   Lobby ID: ${message.lobby_id}`);
    console.log(`   Players: ${message.players.length}`);
    
    // Test 4: Test auto-reconnect simulation
    console.log('\n🔄 Test 4: Simulating auto-reconnect');
    console.log('   (This would normally happen on page refresh)');
    
    // Close connection and reconnect
    setTimeout(() => {
      console.log('\n🔄 Closing connection and reconnecting...');
      ws.close();
      
      setTimeout(() => {
        console.log('🔄 Reconnecting...');
        const ws2 = new WebSocket('ws://localhost:8080/ws');
        
        ws2.on('open', () => {
          console.log('✅ Reconnected successfully');
          
          // Try to register with the same username (should work)
          console.log('📝 Attempting to register with same username...');
          ws2.send(JSON.stringify({
            action: 'register_user',
            username: 'testuser'
          }));
        });
        
        ws2.on('message', (data) => {
          const msg = JSON.parse(data.toString());
          console.log('📨 Reconnect response:', msg);
          
          if (msg.action === 'user_registered') {
            console.log('✅ Auto-reconnect registration successful!');
            console.log('🎉 All tests passed!');
            ws2.close();
            process.exit(0);
          } else if (msg.action === 'error') {
            console.log('❌ Auto-reconnect failed:', msg.message);
            ws2.close();
            process.exit(1);
          }
        });
        
        ws2.on('error', (error) => {
          console.log('❌ Reconnect error:', error);
          process.exit(1);
        });
      }, 1000);
    }, 2000);
    
  } else if (message.action === 'error') {
    console.log('❌ Error received:', message.message);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 10000); 