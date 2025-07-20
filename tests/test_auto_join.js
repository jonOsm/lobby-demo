const WebSocket = require('ws');

console.log('Testing auto-join functionality after lobby creation...');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  
  // Test scenario: Create lobby with username, should auto-join
  console.log('\n📝 Creating lobby with username...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'AutoJoinTest',
    max_players: 4,
    public: true
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  if (response.action === 'lobby_created') {
    console.log('\n🎉 Lobby created successfully');
    console.log('📋 Lobby ID:', response.lobby_id);
    console.log('👥 Players:', response.players);
    console.log('⏳ Waiting for auto-join response...');
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    console.log('\n✅ Auto-join successful!');
    console.log('👥 Players in lobby:', response.players);
    console.log('🎮 Lobby state:', response.state);
    
    // Check if the player is actually in the lobby
    const playerInLobby = response.players.some(p => p.username === 'Alice');
    if (playerInLobby) {
      console.log('✅ SUCCESS: Player "Alice" is in the lobby!');
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