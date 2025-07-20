const WebSocket = require('ws');

console.log('Testing lobby deletion and re-join functionality...');

const ws = new WebSocket('ws://localhost:8080/ws');

let step = 0;

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  step1();
});

function step1() {
  console.log('\n📝 Step 1: Creating first lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'TestLobby1',
    max_players: 4,
    public: true
  }));
}

function step2() {
  console.log('\n👤 Step 2: Joining first lobby...');
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'TestLobby1',
    username: 'Alice'
  }));
}

function step3() {
  console.log('\n🚪 Step 3: Leaving first lobby (should delete it)...');
  ws.send(JSON.stringify({
    action: 'leave_lobby',
    lobby_id: 'TestLobby1',
    username: 'Alice'
  }));
}

function step4() {
  console.log('\n📝 Step 4: Creating second lobby...');
  ws.send(JSON.stringify({
    action: 'create_lobby',
    name: 'TestLobby2',
    max_players: 4,
    public: true
  }));
}

function step5() {
  console.log('\n👤 Step 5: Joining second lobby...');
  ws.send(JSON.stringify({
    action: 'join_lobby',
    lobby_id: 'TestLobby2',
    username: 'Alice'
  }));
}

function step6() {
  console.log('\n📋 Step 6: Listing lobbies to verify only one exists...');
  ws.send(JSON.stringify({
    action: 'list_lobbies'
  }));
}

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  step++;
  
  if (response.action === 'lobby_created') {
    if (response.lobby_id === 'TestLobby1') {
      step2();
    } else if (response.lobby_id === 'TestLobby2') {
      step5();
    }
  } else if (response.action === 'lobby_state' && response.players.length > 0) {
    if (response.lobby_id === 'TestLobby1') {
      step3();
    } else if (response.lobby_id === 'TestLobby2') {
      step6();
    }
  } else if (response.action === 'lobby_state' && response.players.length === 0) {
    if (response.lobby_id === 'TestLobby1') {
      step4();
    }
  } else if (response.action === 'lobby_list') {
    console.log('\n🎉 SUCCESS: Lobby list received');
    console.log('📋 Available lobbies:', response.lobbies);
    if (response.lobbies.length === 1 && response.lobbies[0] === 'TestLobby2') {
      console.log('✅ SUCCESS: Only the second lobby exists, first lobby was properly deleted!');
    } else {
      console.log('❌ FAILURE: Expected only TestLobby2 to exist');
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