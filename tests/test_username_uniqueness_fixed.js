const WebSocket = require('ws');

console.log('🧪 Testing Username Uniqueness (Fixed)...\n');

// Test username uniqueness with proper connection handling
async function testUsernameUniqueness() {
  console.log('📝 Testing Username Uniqueness...');
  
  const ws1 = new WebSocket('ws://localhost:8080/ws');
  const ws2 = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve) => {
    let firstRegistered = false;
    let secondAttempted = false;
    let firstUserId = null;
    
    ws1.on('open', () => {
      console.log('🔵 User 1: Connecting...');
      ws1.send(JSON.stringify({
        action: 'register_user',
        username: 'UniqueTestUser'
      }));
    });
    
    ws2.on('open', () => {
      console.log('🟢 User 2: Connecting...');
      // Wait a bit for first registration
      setTimeout(() => {
        ws2.send(JSON.stringify({
          action: 'register_user',
          username: 'UniqueTestUser' // Same username
        }));
        secondAttempted = true;
      }, 500);
    });
    
    ws1.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('🔵 User 1 received:', response);
      
      if (response.action === 'user_registered') {
        console.log('✅ First user registered successfully');
        firstUserId = response.user_id;
        firstRegistered = true;
        // Don't close the connection yet
      }
    });
    
    ws2.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('🟢 User 2 received:', response);
      
      if (response.action === 'error' && response.message === 'username already taken') {
        console.log('✅ Username uniqueness enforced correctly');
        ws1.close();
        ws2.close();
        resolve({ success: true });
      } else if (response.action === 'user_registered') {
        console.log('❌ Duplicate username was allowed');
        console.log('First user ID:', firstUserId);
        console.log('Second user ID:', response.user_id);
        ws1.close();
        ws2.close();
        resolve({ success: false, error: 'Duplicate username allowed' });
      }
    });
    
    // Timeout to ensure we don't hang
    setTimeout(() => {
      if (firstRegistered && secondAttempted) {
        console.log('⚠️ Timeout waiting for uniqueness test');
        ws1.close();
        ws2.close();
        resolve({ success: false, error: 'Timeout waiting for uniqueness test' });
      }
    }, 3000);
  });
}

// Test that usernames are available after connection closes
async function testUsernameAvailabilityAfterDisconnect() {
  console.log('\n📝 Testing Username Availability After Disconnect...');
  
  const ws1 = new WebSocket('ws://localhost:8080/ws');
  
  return new Promise((resolve) => {
    ws1.on('open', () => {
      console.log('🔵 User 1: Connecting...');
      ws1.send(JSON.stringify({
        action: 'register_user',
        username: 'DisconnectTestUser'
      }));
    });
    
    ws1.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log('🔵 User 1 received:', response);
      
      if (response.action === 'user_registered') {
        console.log('✅ First user registered successfully');
        console.log('🔄 Closing connection...');
        ws1.close();
        
        // Wait a bit, then try to register the same username
        setTimeout(() => {
          const ws2 = new WebSocket('ws://localhost:8080/ws');
          
          ws2.on('open', () => {
            console.log('🟢 User 2: Connecting with same username...');
            ws2.send(JSON.stringify({
              action: 'register_user',
              username: 'DisconnectTestUser'
            }));
          });
          
          ws2.on('message', (data) => {
            const response2 = JSON.parse(data.toString());
            console.log('🟢 User 2 received:', response2);
            
            if (response2.action === 'user_registered') {
              console.log('✅ Username available after disconnect (correct behavior)');
              ws2.close();
              resolve({ success: true });
            } else if (response2.action === 'error') {
              console.log('❌ Username still taken after disconnect:', response2.message);
              ws2.close();
              resolve({ success: false, error: 'Username still taken after disconnect' });
            }
          });
          
          ws2.on('error', (err) => {
            console.log('❌ User 2 connection error:', err.message);
            resolve({ success: false, error: err.message });
          });
        }, 1000);
      }
    });
    
    ws1.on('error', (err) => {
      console.log('❌ User 1 connection error:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting Username Uniqueness Tests...\n');
  
  const results = [];
  
  // Test 1: Username uniqueness with active connections
  const uniqueResult = await testUsernameUniqueness();
  results.push({ test: 'Username Uniqueness (Active)', ...uniqueResult });
  
  // Test 2: Username availability after disconnect
  const disconnectResult = await testUsernameAvailabilityAfterDisconnect();
  results.push({ test: 'Username After Disconnect', ...disconnectResult });
  
  // Print results
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.test}: ${status}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Username uniqueness is working correctly!');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runTests(); 