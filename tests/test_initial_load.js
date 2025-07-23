const WebSocket = require('ws');

// Test that initial page load doesn't show "User not registered" error
async function testInitialLoad() {
  console.log('🧪 Testing initial page load...');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve, reject) => {
    let errorReceived = false;
    let messages = [];
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messages.push(message);
      console.log('📨 Received:', message);
      
      // Check if we received an error about user not being registered
      if (message.action === 'error' && message.message.includes('not registered')) {
        errorReceived = true;
        console.log('❌ ERROR: Received "not registered" error on initial load');
      }
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
    });
    
    // Wait a bit to see if any errors are received
    setTimeout(() => {
      ws.close();
      
      if (errorReceived) {
        console.log('❌ TEST FAILED: Initial page load shows "User not registered" error');
        reject(new Error('Initial page load shows "User not registered" error'));
      } else {
        console.log('✅ TEST PASSED: No "User not registered" error on initial load');
        console.log('📊 Messages received:', messages.length);
        resolve();
      }
    }, 2000);
  });
}

// Test that registration works correctly
async function testRegistration() {
  console.log('\n🧪 Testing user registration...');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve, reject) => {
    let registered = false;
    let errorReceived = false;
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected for registration test');
      
      // Send registration request
      ws.send(JSON.stringify({
        action: 'register_user',
        data: { username: 'testuser' }
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Registration test received:', message);
      
      if (message.action === 'user_registered') {
        registered = true;
        console.log('✅ User registered successfully');
      } else if (message.action === 'error') {
        errorReceived = true;
        console.log('❌ Registration error:', message.message);
      }
    });
    
    setTimeout(() => {
      ws.close();
      
      if (errorReceived) {
        console.log('❌ REGISTRATION TEST FAILED');
        reject(new Error('Registration failed'));
      } else if (registered) {
        console.log('✅ REGISTRATION TEST PASSED');
        resolve();
      } else {
        console.log('❌ REGISTRATION TEST FAILED: No registration response');
        reject(new Error('No registration response'));
      }
    }, 3000);
  });
}

// Run tests
async function runTests() {
  try {
    await testInitialLoad();
    await testRegistration();
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
  } catch (error) {
    console.log('\n💥 TESTS FAILED:', error.message);
    process.exit(1);
  }
}

runTests(); 