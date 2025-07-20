const WebSocket = require('ws');

console.log('🧪 Testing Complete User ID System...\n');

// Test multiple users
const testUsers = [
  { username: 'Alice', color: '🔵' },
  { username: 'Bob', color: '🟢' },
  { username: 'Charlie', color: '🟡' }
];

let testResults = {
  registration: { passed: 0, failed: 0 },
  lobbyCreation: { passed: 0, failed: 0 },
  lobbyJoining: { passed: 0, failed: 0 },
  readyStatus: { passed: 0, failed: 0 },
  gameStart: { passed: 0, failed: 0 },
  lobbyLeaving: { passed: 0, failed: 0 }
};

let lobbyId = null;
let users = [];

async function testUserRegistration() {
  console.log('📝 Testing User Registration...');
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    await new Promise((resolve) => {
      ws.on('open', () => {
        console.log(`${user.color} ${user.username}: Connecting...`);
        ws.send(JSON.stringify({
          action: 'register_user',
          username: user.username
        }));
      });
      
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        console.log(`${user.color} ${user.username}: Received ${response.action}`);
        
        if (response.action === 'user_registered') {
          console.log(`${user.color} ${user.username}: ✅ Registered with ID ${response.user_id.substring(0, 8)}...`);
          users.push({
            ws,
            username: user.username,
            userId: response.user_id,
            color: user.color
          });
          testResults.registration.passed++;
          resolve();
        } else if (response.action === 'error') {
          console.log(`${user.color} ${user.username}: ❌ Registration failed: ${response.message}`);
          testResults.registration.failed++;
          resolve();
        }
      });
      
      ws.on('error', (err) => {
        console.log(`${user.color} ${user.username}: ❌ Connection error: ${err.message}`);
        testResults.registration.failed++;
        resolve();
      });
    });
  }
  
  console.log(`✅ Registration complete: ${testResults.registration.passed} passed, ${testResults.registration.failed} failed\n`);
}

async function testLobbyCreation() {
  console.log('🏗️ Testing Lobby Creation...');
  
  if (users.length === 0) {
    console.log('❌ No users registered, skipping lobby creation test');
    return;
  }
  
  const creator = users[0];
  const ws = creator.ws;
  
  return new Promise((resolve) => {
    ws.send(JSON.stringify({
      action: 'create_lobby',
      name: 'UserIDSystemTest',
      max_players: 4,
      public: true
    }));
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log(`${creator.color} ${creator.username}: Received ${response.action}`);
      
      if (response.action === 'lobby_created') {
        console.log(`${creator.color} ${creator.username}: ✅ Lobby created: ${response.lobby_id}`);
        lobbyId = response.lobby_id;
        testResults.lobbyCreation.passed++;
        resolve();
      } else if (response.action === 'lobby_state') {
        console.log(`${creator.color} ${creator.username}: ✅ Auto-joined lobby`);
        testResults.lobbyJoining.passed++;
      } else if (response.action === 'error') {
        console.log(`${creator.color} ${creator.username}: ❌ Lobby creation failed: ${response.message}`);
        testResults.lobbyCreation.failed++;
        resolve();
      }
    });
  });
}

async function testLobbyJoining() {
  console.log('🚪 Testing Lobby Joining...');
  
  if (users.length < 2 || !lobbyId) {
    console.log('❌ Not enough users or no lobby, skipping join test');
    return;
  }
  
  const joinPromises = users.slice(1).map(user => {
    return new Promise((resolve) => {
      user.ws.send(JSON.stringify({
        action: 'join_lobby',
        lobby_id: lobbyId,
        user_id: user.userId
      }));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log(`${user.color} ${user.username}: Received ${response.action}`);
        
        if (response.action === 'lobby_state') {
          const playerInLobby = response.players.some(p => p.user_id === user.userId);
          if (playerInLobby) {
            console.log(`${user.color} ${user.username}: ✅ Successfully joined lobby`);
            testResults.lobbyJoining.passed++;
          } else {
            console.log(`${user.color} ${user.username}: ❌ Not found in lobby players`);
            testResults.lobbyJoining.failed++;
          }
          user.ws.off('message', messageHandler);
          resolve();
        } else if (response.action === 'error') {
          console.log(`${user.color} ${user.username}: ❌ Join failed: ${response.message}`);
          testResults.lobbyJoining.failed++;
          user.ws.off('message', messageHandler);
          resolve();
        }
      };
      
      user.ws.on('message', messageHandler);
    });
  });
  
  await Promise.all(joinPromises);
  console.log(`✅ Joining complete: ${testResults.lobbyJoining.passed} passed, ${testResults.lobbyJoining.failed} failed\n`);
}

async function testReadyStatus() {
  console.log('✅ Testing Ready Status...');
  
  if (users.length === 0 || !lobbyId) {
    console.log('❌ No users or no lobby, skipping ready test');
    return;
  }
  
  const readyPromises = users.map(user => {
    return new Promise((resolve) => {
      user.ws.send(JSON.stringify({
        action: 'set_ready',
        lobby_id: lobbyId,
        user_id: user.userId,
        ready: true
      }));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log(`${user.color} ${user.username}: Received ${response.action}`);
        
        if (response.action === 'lobby_state') {
          const player = response.players.find(p => p.user_id === user.userId);
          if (player && player.ready) {
            console.log(`${user.color} ${user.username}: ✅ Ready status set successfully`);
            testResults.readyStatus.passed++;
          } else {
            console.log(`${user.color} ${user.username}: ❌ Ready status not set`);
            testResults.readyStatus.failed++;
          }
          user.ws.off('message', messageHandler);
          resolve();
        } else if (response.action === 'error') {
          console.log(`${user.color} ${user.username}: ❌ Ready status failed: ${response.message}`);
          testResults.readyStatus.failed++;
          user.ws.off('message', messageHandler);
          resolve();
        }
      };
      
      user.ws.on('message', messageHandler);
    });
  });
  
  await Promise.all(readyPromises);
  console.log(`✅ Ready status complete: ${testResults.readyStatus.passed} passed, ${testResults.readyStatus.failed} failed\n`);
}

async function testGameStart() {
  console.log('🎮 Testing Game Start...');
  
  if (users.length < 2 || !lobbyId) {
    console.log('❌ Not enough users or no lobby, skipping game start test');
    return;
  }
  
  const creator = users[0];
  const ws = creator.ws;
  
  return new Promise((resolve) => {
    ws.send(JSON.stringify({
      action: 'start_game',
      lobby_id: lobbyId,
      user_id: creator.userId
    }));
    
    ws.on('message', (data) => {
      const response = JSON.parse(data.toString());
      console.log(`${creator.color} ${creator.username}: Received ${response.action}`);
      
      if (response.action === 'lobby_state' && response.state === 'in_game') {
        console.log(`${creator.color} ${creator.username}: ✅ Game started successfully`);
        testResults.gameStart.passed++;
        resolve();
      } else if (response.action === 'error') {
        console.log(`${creator.color} ${creator.username}: ❌ Game start failed: ${response.message}`);
        testResults.gameStart.failed++;
        resolve();
      }
    });
  });
}

async function testLobbyLeaving() {
  console.log('👋 Testing Lobby Leaving...');
  
  if (users.length === 0 || !lobbyId) {
    console.log('❌ No users or no lobby, skipping leave test');
    return;
  }
  
  const leavePromises = users.map(user => {
    return new Promise((resolve) => {
      user.ws.send(JSON.stringify({
        action: 'leave_lobby',
        lobby_id: lobbyId,
        user_id: user.userId
      }));
      
      const messageHandler = (data) => {
        const response = JSON.parse(data.toString());
        console.log(`${user.color} ${user.username}: Received ${response.action}`);
        
        if (response.action === 'lobby_state') {
          const playerInLobby = response.players.some(p => p.user_id === user.userId);
          if (!playerInLobby) {
            console.log(`${user.color} ${user.username}: ✅ Successfully left lobby`);
            testResults.lobbyLeaving.passed++;
          } else {
            console.log(`${user.color} ${user.username}: ❌ Still in lobby`);
            testResults.lobbyLeaving.failed++;
          }
          user.ws.off('message', messageHandler);
          resolve();
        } else if (response.action === 'error') {
          console.log(`${user.color} ${user.username}: ❌ Leave failed: ${response.message}`);
          testResults.lobbyLeaving.failed++;
          user.ws.off('message', messageHandler);
          resolve();
        }
      };
      
      user.ws.on('message', messageHandler);
    });
  });
  
  await Promise.all(leavePromises);
  console.log(`✅ Leaving complete: ${testResults.lobbyLeaving.passed} passed, ${testResults.lobbyLeaving.failed} failed\n`);
}

async function runAllTests() {
  try {
    await testUserRegistration();
    await testLobbyCreation();
    await testLobbyJoining();
    await testReadyStatus();
    await testGameStart();
    await testLobbyLeaving();
    
    // Close all connections
    users.forEach(user => user.ws.close());
    
    // Print final results
    console.log('📊 FINAL TEST RESULTS:');
    console.log('======================');
    Object.entries(testResults).forEach(([test, result]) => {
      const status = result.failed === 0 ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test}: ${status} (${result.passed} passed, ${result.failed} failed)`);
    });
    
    const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
    console.log(`\n🎯 OVERALL: ${totalPassed} passed, ${totalFailed} failed`);
    
    if (totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! User ID system is working perfectly!');
    } else {
      console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Run the tests
runAllTests(); 