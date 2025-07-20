const WebSocket = require('ws');

console.log('🔍 Debugging User ID System...\n');

// Test single user flow
const ws = new WebSocket('ws://localhost:8080/ws');
let userId = null;
let username = null;

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  step1();
});

function step1() {
  console.log('\n👤 Step 1: Registering user...');
  ws.send(JSON.stringify({
    action: 'register_user',
    username: 'DebugUser'
  }));
}

function step2() {
  console.log('\n📝 Step 2: Creating lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'DebugLobby',
    max_players: 4,
    public: true
  }));
}

function step3() {
  console.log('\n🚪 Step 3: Joining lobby...');
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'DebugLobby',
    user_id: userId
  }));
}

function step4() {
  console.log('\n✅ Step 4: Setting ready...');
  ws.send(JSON.stringify({
    action: 'set_ready',
    lobby_id: 'DebugLobby',
    user_id: userId,
    ready: true
  }));
}

function step5() {
  console.log('\n🎮 Step 5: Starting game...');
  ws.send(JSON.stringify({
    action: 'start_game',
    lobby_id: 'DebugLobby',
    user_id: userId
  }));
}

function step6() {
  console.log('\n👋 Step 6: Leaving lobby...');
  ws.send(JSON.stringify({
    action: 'leave_lobby',
    lobby_id: 'DebugLobby',
    user_id: userId
  }));
}

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  if (response.action === 'user_registered') {
    console.log('\n🎉 User registered successfully!');
    console.log('🆔 User ID:', response.user_id);
    console.log('👤 Username:', response.username);
    userId = response.user_id;
    username = response.username;
    step2();
  } else if (response.action === 'lobby_created') {
    console.log('\n🎉 Lobby created successfully!');
    step3();
  } else if (response.action === 'lobby_state') {
    console.log('\n✅ Lobby state received');
    console.log('👥 Players in lobby:', response.players);
    
    // Check if the player is in the lobby
    const playerInLobby = response.players.some(p => p.user_id === userId);
    if (playerInLobby) {
      console.log('✅ Player found in lobby with correct user ID!');
      
      // Continue with next step based on current state
      if (response.players.length === 1 && !response.players[0].ready) {
        step4();
      } else if (response.players.length === 1 && response.players[0].ready) {
        step5();
      } else if (response.state === 'in_game') {
        step6();
      }
    } else {
      console.log('❌ Player not found in lobby');
      console.log('Expected user ID:', userId);
      console.log('Available players:', response.players.map(p => ({ user_id: p.user_id, username: p.username })));
    }
  } else if (response.action === 'error') {
    console.log('❌ Error received:', response.message);
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
}); 