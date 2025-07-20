const WebSocket = require('ws');

console.log('Starting test...');

const ws = new WebSocket('ws://localhost:8080/ws');

let step = 0;

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  step1();
});

function step1() {
  console.log('\n📝 Step 1: Creating lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'TestLobby',
    max_players: 4,
    public: true
  }));
}

function step2() {
  console.log('\n👤 Step 2: Joining lobby...');
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'TestLobby',
    username: 'Alice'
  }));
}

function step3() {
  console.log('\n🚪 Step 3: Leaving lobby...');
  ws.send(JSON.stringify({
    action: 'leave_lobby',
    lobby_id: 'TestLobby',
    username: 'Alice'
  }));
}

function step4() {
  console.log('\n❌ Step 4: Trying to leave lobby again (should fail)...');
  ws.send(JSON.stringify({
    action: 'leave_lobby',
    lobby_id: 'TestLobby',
    username: 'Alice'
  }));
}

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  step++;
  
  if (response.action === 'lobby_created') {
    step2();
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    step3();
  } else if (response.action === 'lobby_state' && response.players.length === 0) {
    step4();
  } else if (response.action === 'error' && response.message === 'player not in lobby') {
    console.log('\n🎉 SUCCESS: Successfully reproduced and handled "player not in lobby" error');
    console.log('✅ The fix is working correctly!');
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
}); 