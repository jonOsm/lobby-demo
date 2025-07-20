const WebSocket = require('ws');

console.log('🧪 Testing User ID Consistency');
console.log('==============================');

let firstUserId = null;
let secondUserId = null;

function testReconnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Register with username "consistency_test"
      console.log('📝 Registering user "consistency_test"');
      ws.send(JSON.stringify({
        action: 'register_user',
        username: 'consistency_test'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Received:', message);
      
      if (message.action === 'user_registered') {
        if (!firstUserId) {
          firstUserId = message.user_id;
          console.log('✅ First registration - User ID:', firstUserId);
          
          // Close connection and reconnect
          setTimeout(() => {
            console.log('🔄 Closing connection...');
            ws.close();
            
            setTimeout(() => {
              console.log('🔄 Reconnecting...');
              testSecondConnection();
            }, 1000);
          }, 2000);
        } else {
          secondUserId = message.user_id;
          console.log('✅ Second registration - User ID:', secondUserId);
          
          // Compare user IDs
          if (firstUserId === secondUserId) {
            console.log('🎉 SUCCESS: Same user ID maintained!');
            console.log('   First ID:  ' + firstUserId);
            console.log('   Second ID: ' + secondUserId);
            resolve(true);
          } else {
            console.log('❌ FAILURE: Different user IDs!');
            console.log('   First ID:  ' + firstUserId);
            console.log('   Second ID: ' + secondUserId);
            reject(new Error('User IDs are different'));
          }
          
          ws.close();
        }
      } else if (message.action === 'error') {
        console.log('❌ Error:', message.message);
        reject(new Error(message.message));
      }
    });

    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket closed');
    });
  });
}

function testSecondConnection() {
  const ws2 = new WebSocket('ws://localhost:8080/ws');
  
  ws2.on('open', () => {
    console.log('✅ Second WebSocket connected');
    
    // Register with the same username
    console.log('📝 Re-registering user "consistency_test"');
    ws2.send(JSON.stringify({
      action: 'register_user',
      username: 'consistency_test'
    }));
  });

  ws2.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('📨 Second connection received:', message);
    
    if (message.action === 'user_registered') {
      secondUserId = message.user_id;
      console.log('✅ Second registration - User ID:', secondUserId);
      
      // Compare user IDs
      if (firstUserId === secondUserId) {
        console.log('🎉 SUCCESS: Same user ID maintained!');
        console.log('   First ID:  ' + firstUserId);
        console.log('   Second ID: ' + secondUserId);
        ws2.close();
        process.exit(0);
      } else {
        console.log('❌ FAILURE: Different user IDs!');
        console.log('   First ID:  ' + firstUserId);
        console.log('   Second ID: ' + secondUserId);
        ws2.close();
        process.exit(1);
      }
    } else if (message.action === 'error') {
      console.log('❌ Error:', message.message);
      ws2.close();
      process.exit(1);
    }
  });

  ws2.on('error', (error) => {
    console.log('❌ Second WebSocket error:', error);
    process.exit(1);
  });
}

// Start the test
testReconnection().catch((error) => {
  console.log('❌ Test failed:', error.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(1);
}, 10000); 