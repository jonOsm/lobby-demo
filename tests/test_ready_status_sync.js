const WebSocket = require('ws');

console.log('🧪 Testing Ready Status Synchronization and Game Start');
console.log('=====================================================');

let hostUserId = null;
let playerUserId = null;
let lobbyId = null;

async function testReadyStatusSync() {
  console.log('🚀 Starting Ready Status Sync Test...\n');

  // Step 1: Host connects and creates lobby
  console.log('📝 Step 1: Host creates lobby');
  const hostWs = new WebSocket('ws://localhost:8080/ws');
  
  await new Promise((resolve, reject) => {
    hostWs.on('open', () => {
      console.log('✅ Host connected');
      hostWs.send(JSON.stringify({
        action: 'register_user',
        username: 'host_user'
      }));
    });

    hostWs.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Host received:', response.action);
      
      if (response.action === 'user_registered') {
        hostUserId = response.user_id;
        console.log('✅ Host registered with ID:', hostUserId.substring(0, 8) + '...');
        
        // Create lobby
        hostWs.send(JSON.stringify({
          action: 'create_lobby',
          name: 'Ready Test Lobby',
          max_players: 4,
          public: true,
          user_id: hostUserId
        }));
      } else if (response.action === 'lobby_state') {
        lobbyId = response.lobby_id;
        console.log('✅ Lobby created:', lobbyId);
        console.log('   Players:', response.players.map(p => `${p.username} (${p.ready ? 'Ready' : 'Not Ready'})`).join(', '));
        resolve();
      }
    });
  });

  // Step 2: Second player joins
  console.log('\n📝 Step 2: Second player joins');
  const playerWs = new WebSocket('ws://localhost:8080/ws');
  
  await new Promise((resolve, reject) => {
    playerWs.on('open', () => {
      console.log('✅ Player connected');
      playerWs.send(JSON.stringify({
        action: 'register_user',
        username: 'player_user'
      }));
    });

    playerWs.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('📨 Player received:', response.action);
      
      if (response.action === 'user_registered') {
        playerUserId = response.user_id;
        console.log('✅ Player registered with ID:', playerUserId.substring(0, 8) + '...');
        
        // Join lobby
        playerWs.send(JSON.stringify({
          action: 'join_lobby',
          lobby_id: lobbyId,
          user_id: playerUserId
        }));
      } else if (response.action === 'lobby_state') {
        console.log('✅ Player joined lobby');
        console.log('   Players:', response.players.map(p => `${p.username} (${p.ready ? 'Ready' : 'Not Ready'})`).join(', '));
        resolve();
      }
    });
  });

  // Step 3: Host sets ready
  console.log('\n📝 Step 3: Host sets ready');
  await new Promise((resolve, reject) => {
    hostWs.send(JSON.stringify({
      action: 'set_ready',
      lobby_id: lobbyId,
      user_id: hostUserId,
      ready: true
    }));

    hostWs.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.action === 'lobby_state') {
        console.log('✅ Host set ready');
        console.log('   Players:', response.players.map(p => `${p.username} (${p.ready ? 'Ready' : 'Not Ready'})`).join(', '));
        resolve();
      }
    });
  });

  // Step 4: Player sets ready
  console.log('\n📝 Step 4: Player sets ready');
  await new Promise((resolve, reject) => {
    playerWs.send(JSON.stringify({
      action: 'set_ready',
      lobby_id: lobbyId,
      user_id: playerUserId,
      ready: true
    }));

    playerWs.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.action === 'lobby_state') {
        console.log('✅ Player set ready');
        console.log('   Players:', response.players.map(p => `${p.username} (${p.ready ? 'Ready' : 'Not Ready'})`).join(', '));
        resolve();
      }
    });
  });

  // Step 5: Try to start game
  console.log('\n📝 Step 5: Try to start game');
  await new Promise((resolve, reject) => {
    hostWs.send(JSON.stringify({
      action: 'start_game',
      lobby_id: lobbyId,
      user_id: hostUserId
    }));

    hostWs.on('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.action === 'lobby_state') {
        console.log('🎉 SUCCESS: Game started!');
        console.log('   Lobby state:', response.state);
        console.log('   Players:', response.players.map(p => `${p.username} (${p.ready ? 'Ready' : 'Not Ready'})`).join(', '));
        resolve();
      } else if (response.action === 'error') {
        console.log('❌ FAILED: Game start error:', response.message);
        reject(new Error(response.message));
      }
    });
  });

  // Cleanup
  hostWs.close();
  playerWs.close();
  console.log('\n✅ Test completed successfully!');
}

// Run the test
testReadyStatusSync().catch((error) => {
  console.log('\n❌ Test failed:', error.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 30000); 