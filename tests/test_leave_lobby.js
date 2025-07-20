const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  
  // Test scenario: Create lobby, join, leave, then try to leave again
  console.log('\n1. Creating lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'TestLobby',
    max_players: 4,
    public: true
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('Received:', response);
  
  if (response.action === 'lobby_created') {
    console.log('\n2. Joining lobby...');
    ws.send(JSON.stringify({
      action: 'join_lobby',
      lobby_id: 'TestLobby',
      username: 'Alice'
    }));
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    console.log('\n3. Leaving lobby...');
    ws.send(JSON.stringify({
      action: 'leave_lobby',
      lobby_id: 'TestLobby',
      username: 'Alice'
    }));
  } else if (response.action === 'lobby_state' && response.players.length === 0) {
    console.log('\n4. Trying to leave lobby again (should fail)...');
    ws.send(JSON.stringify({
      action: 'leave_lobby',
      lobby_id: 'TestLobby',
      username: 'Alice'
    }));
  } else if (response.action === 'error' && response.message === 'player not in lobby') {
    console.log('\n✅ Test completed: Successfully reproduced "player not in lobby" error');
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
}); 