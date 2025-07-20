const WebSocket = require('ws');

console.log('Testing web interface simulation - create lobby with username...');

const ws = new WebSocket('ws://localhost:8080/ws');

let step = 0;

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  step1();
});

function step1() {
  console.log('\n📝 Step 1: Creating lobby (simulating web interface)...');
  // This simulates what the web interface sends
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'WebTestLobby',
    max_players: 4,
    public: true
  }));
}

function step2() {
  console.log('\n👤 Step 2: Auto-joining as creator (this should happen automatically)...');
  // This simulates the auto-join that should happen after lobby creation
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'WebTestLobby',
    username: 'Alice'
  }));
}

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  step++;
  
  if (response.action === 'lobby_created') {
    console.log('\n🎉 Lobby created, now should auto-join...');
    step2();
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    console.log('\n✅ SUCCESS: Player joined lobby!');
    console.log('👥 Players in lobby:', response.players);
    
    // Check if the player is actually in the lobby
    const playerInLobby = response.players.some(p => p.username === 'Alice');
    if (playerInLobby) {
      console.log('✅ SUCCESS: Player "Alice" is in the lobby!');
    } else {
      console.log('❌ FAILURE: Player "Alice" is not in the lobby');
    }
    
    ws.close();
  } else if (response.action === 'lobby_state' && response.players.length === 0) {
    console.log('\n⚠️ Lobby state received but no players - this might be the initial state');
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