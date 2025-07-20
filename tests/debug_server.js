const WebSocket = require('ws');

console.log('🔍 Debug Server Connection');
console.log('==========================');

const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', () => {
  console.log('✅ WebSocket connected');
  
  // Test 1: Send a simple message to see if server responds
  console.log('\n📤 Test 1: Sending simple message');
  const testMessage = {
    action: 'register_user',
    username: 'debuguser'
  };
  
  console.log('Sending:', JSON.stringify(testMessage));
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  console.log('\n📨 Raw message received:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Parsed message:', message);
    
    if (message.action === 'error') {
      console.log('❌ Server error:', message.message);
    } else if (message.action === 'user_registered') {
      console.log('✅ User registration successful!');
    }
  } catch (err) {
    console.log('❌ Failed to parse message:', err);
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket closed:', code, reason);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('⏰ Debug timeout');
  ws.close();
  process.exit(0);
}, 5000); 