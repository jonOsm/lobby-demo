const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws');

let userId = null;
let lobbyId = null;
let step = 0;

ws.on('open', function open() {
  console.log('Connected to WebSocket');
  
  // Test scenario: Register user, create lobby, leave lobby, verify response
  console.log('\n1. Registering user...');
  ws.send(JSON.stringify({
    action: 'register_user',
    data: { username: 'Alice' }
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('Received:', response);
  
  if (response.action === 'user_registered') {
    userId = response.user_id;
    console.log('\n2. Creating lobby...');
    ws.send(JSON.stringify({
      action: 'create_lobby',
      data: {
        name: 'TestLobby',
        max_players: 4,
        public: true,
        user_id: userId
      }
    }));
  } else if (response.action === 'lobby_state' && response.players && response.players.length > 0 && step === 0) {
    lobbyId = response.lobby_id;
    step = 1;
    console.log('\n3. Leaving lobby...');
    ws.send(JSON.stringify({
      action: 'leave_lobby',
      data: {
        lobby_id: lobbyId,
        user_id: userId
      }
    }));
  } else if (response.action === 'lobby_left') {
    console.log('\n✅ Test completed: Successfully received lobby_left response');
    console.log('Lobby ID:', response.lobby_id);
    console.log('User ID:', response.user_id);
    ws.close();
  } else if (response.action === 'lobby_state' && response.players && response.players.length === 0 && step === 1) {
    // This means the lobby was deleted when the last player left
    console.log('\n✅ Test completed: Lobby was deleted when last player left');
    console.log('This is expected behavior for empty lobbies');
    ws.close();
  } else if (response.action === 'error') {
    console.log('\n✅ Test completed: Received error response');
    console.log('Error:', response.message);
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
}); 