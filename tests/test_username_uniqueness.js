const WebSocket = require('ws');

console.log('Testing username uniqueness...');

// Test 1: Register first user
const ws1 = new WebSocket('ws://localhost:8080/ws');
let userId1 = null;

ws1.on('open', function open() {
  console.log('✅ Connected first user');
  ws1.send(JSON.stringify({
    action: 'register_user',
    username: 'TestUser'
  }));
});

ws1.on('message', function message(data) {
  const response = JSON.parse(data.toString());
  console.log('📨 User 1 received:', response);
  
  if (response.action === 'user_registered') {
    console.log('✅ First user registered successfully!');
    console.log('🆔 User ID:', response.user_id);
    userId1 = response.user_id;
    
    // Test 2: Try to register second user with same username
    testSecondUser();
  } else if (response.action === 'error') {
    console.log('❌ Error:', response.message);
  }
});

function testSecondUser() {
  console.log('\n👤 Testing second user with same username...');
  const ws2 = new WebSocket('ws://localhost:8080/ws');
  
  ws2.on('open', function open() {
    console.log('✅ Connected second user');
    ws2.send(JSON.stringify({
      action: 'register_user',
      username: 'TestUser' // Same username!
    }));
  });
  
  ws2.on('message', function message(data) {
    const response = JSON.parse(data.toString());
    console.log('📨 User 2 received:', response);
    
    if (response.action === 'error' && response.message === 'username already taken') {
      console.log('✅ SUCCESS: Username uniqueness enforced!');
    } else if (response.action === 'user_registered') {
      console.log('❌ FAILURE: Duplicate username was allowed!');
    } else {
      console.log('❌ Unexpected response:', response);
    }
    
    ws2.close();
    ws1.close();
  });
  
  ws2.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
  });
}

ws1.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws1.on('close', function close() {
  console.log('🔌 WebSocket connections closed');
}); 