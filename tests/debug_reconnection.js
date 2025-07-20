const WebSocket = require('ws');

console.log('🔍 Debugging Reconnection Logic');
console.log('===============================');

let firstUserId = null;
let firstResponse = null;

function testFirstConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.on('open', () => {
      console.log('✅ First WebSocket connected');
      
      console.log('📝 Registering user "debug_test"');
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'debug_test'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 First connection received:', JSON.stringify(message, null, 2));
      
      if (message.action === 'user_registered') {
        firstUserId = message.user_id;
        firstResponse = message;
        console.log('✅ First registration successful');
        console.log('   User ID:', firstUserId);
        console.log('   Username:', message.username);
        
        // Close connection
        setTimeout(() => {
          console.log('🔄 Closing first connection...');
          ws.close();
          resolve();
        }, 1000);
      } else if (message.action === 'error') {
        console.log('❌ First registration error:', message.message);
        reject(new Error(message.message));
      } else {
        console.log('❓ Unexpected response:', message);
        reject(new Error('Unexpected response'));
      }
    });

    ws.on('error', (error) => {
      console.log('❌ First WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 First WebSocket closed');
    });
  });
}

function testSecondConnection() {
  return new Promise((resolve, reject) => {
    const ws2 = new WebSocket('ws://localhost:8080/ws');
    
    ws2.on('open', () => {
      console.log('✅ Second WebSocket connected');
      
      console.log('📝 Re-registering user "debug_test"');
      ws2.send(JSON.stringify({
        action: 'register_user',
        username: 'debug_test'
      }));
    });

    ws2.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Second connection received:', JSON.stringify(message, null, 2));
      
      if (message.action === 'user_registered') {
        const secondUserId = message.user_id;
        console.log('✅ Second registration successful');
        console.log('   User ID:', secondUserId);
        console.log('   Username:', message.username);
        
        // Compare user IDs
        if (firstUserId === secondUserId) {
          console.log('🎉 SUCCESS: Same user ID maintained!');
          console.log('   First ID:  ' + firstUserId);
          console.log('   Second ID: ' + secondUserId);
          ws2.close();
          resolve(true);
        } else {
          console.log('❌ FAILURE: Different user IDs!');
          console.log('   First ID:  ' + firstUserId);
          console.log('   Second ID: ' + secondUserId);
          ws2.close();
          reject(new Error('User IDs are different'));
        }
      } else if (message.action === 'error') {
        console.log('❌ Second registration error:', message.message);
        ws2.close();
        reject(new Error(message.message));
      } else {
        console.log('❓ Unexpected response:', message);
        ws2.close();
        reject(new Error('Unexpected response'));
      }
    });

    ws2.on('error', (error) => {
      console.log('❌ Second WebSocket error:', error);
      reject(error);
    });

    ws2.on('close', () => {
      console.log('🔌 Second WebSocket closed');
    });
  });
}

async function runDebugTest() {
  try {
    console.log('🔄 Starting first connection...');
    await testFirstConnection();
    
    console.log('\n🔄 Starting second connection...');
    await testSecondConnection();
    
    console.log('\n🎉 Debug test completed successfully!');
  } catch (error) {
    console.log('\n❌ Debug test failed:', error.message);
    process.exit(1);
  }
}

// Start the debug test
runDebugTest();

// Timeout after 15 seconds
setTimeout(() => {
  console.log('⏰ Debug test timeout');
  process.exit(1);
}, 15000); 