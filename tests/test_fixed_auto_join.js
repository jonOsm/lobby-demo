const WebSocket = require('ws');

console.log('Testing fixed auto-join functionality...');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  
  // Simulate the web interface creating a lobby
  console.log('\n📝 Creating lobby with username...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'FixedTestLobby',
    max_players: 4,
    public: true
  }));
});

let lobbyCreated = false;
let joinSent = false;

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  if (response.action === 'lobby_created') {
    console.log('\n🎉 Lobby created successfully');
    lobbyCreated = true;
    
    // Simulate the auto-join that should happen
    if (!joinSent) {
      console.log('🔄 Sending auto-join message...');
      ws.send(JSON.stringify({
        action: 'join_lobby',
        lobby_id: 'FixedTestLobby',
        username: 'Alice'
      }));
      joinSent = true;
    }
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    console.log('\n✅ SUCCESS: Auto-join worked!');
    console.log('👥 Players in lobby:', response.players);
    
    // Check if the player is actually in the lobby
    const playerInLobby = response.players.some(p => p.username === 'Alice');
    if (playerInLobby) {
      console.log('✅ SUCCESS: Player "Alice" is in the lobby!');
      console.log('🎉 The fix is working correctly!');
    } else {
      console.log('❌ FAILURE: Player "Alice" is not in the lobby');
    }
    
    ws.close();
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