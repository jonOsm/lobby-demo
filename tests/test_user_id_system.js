const WebSocket = require('ws');

console.log('Testing new user ID system...');

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
    username: 'Alice'
  }));
}

function step2() {
  console.log('\n📝 Step 2: Creating lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'UserIDTestLobby',
    max_players: 4,
    public: true
  }));
}

function step3() {
  console.log('\n🚪 Step 3: Joining lobby with user ID...');
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'UserIDTestLobby',
    user_id: userId
  }));
}

function step4() {
  console.log('\n✅ Step 4: Setting ready status...');
  ws.send(JSON.stringify({
    action: 'set_ready',
    lobby_id: 'UserIDTestLobby',
    user_id: userId,
    ready: true
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
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    console.log('\n✅ SUCCESS: User joined lobby with ID!');
    console.log('👥 Players in lobby:', response.players);
    
    // Check if the player is in the lobby with the correct user ID
    const playerInLobby = response.players.some(p => p.user_id === userId && p.username === username);
    if (playerInLobby) {
      console.log('✅ SUCCESS: Player found in lobby with correct user ID!');
      step4();
    } else {
      console.log('❌ FAILURE: Player not found or incorrect user ID');
      ws.close();
    }
  } else if (response.action === 'lobby_state' && response.players.length === 0) {
    console.log('\n⚠️ Lobby state received but no players');
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