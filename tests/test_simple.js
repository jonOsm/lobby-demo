const WebSocket = require('ws');

console.log('Testing basic server connection...');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  console.log('✅ Connected to WebSocket');
  
  // Test a simple message
  console.log('📤 Sending list_lobbies...');
  ws.send(JSON.stringify({
    action: 'list_lobbies'
  }));
});

ws.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 Received:', response);
  
  if (response.action === 'lobby_list') {
    console.log('✅ SUCCESS: Server is responding correctly!');
  } else if (response.action === 'error') {
    console.log('❌ Error:', response.message);
  }
  
  ws.close();
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
}); 