const WebSocket = require('ws');

// Test auto-reconnection functionality
async function testAutoReconnection() {
    console.log('🧪 Testing auto-reconnection functionality...');
    
    const ws1 = new WebSocket('ws://localhost:8080/ws');
    const ws2 = new WebSocket('ws://localhost:8080/ws');
    
    let user1ID, user2ID, lobbyID;
    let user1Reconnected = false;
    let user2Reconnected = false;
    
    // Wait for connections
    await new Promise(resolve => {
        ws1.on('open', () => {
            console.log('✅ User 1 connected');
            ws2.on('open', () => {
                console.log('✅ User 2 connected');
                resolve();
            });
        });
    });
    
    // Register users
    ws1.send(JSON.stringify({
        action: 'register_user',
        data: { username: 'alice' }
    }));
    
    ws2.send(JSON.stringify({
        action: 'register_user',
        data: { username: 'bob' }
    }));
    
    // Handle registration responses
    ws1.on('message', (data) => {
        const msg = JSON.parse(data);
        console.log('📨 User 1 received:', msg.action);
        
        if (msg.action === 'user_registered') {
            user1ID = msg.user_id;
            console.log('👤 User 1 registered with ID:', user1ID);
            
            // Create a lobby
            ws1.send(JSON.stringify({
                action: 'create_lobby',
                data: {
                    name: 'Test Lobby',
                    max_players: 4,
                    public: true,
                    user_id: user1ID
                }
            }));
        } else if (msg.action === 'lobby_state') {
            lobbyID = msg.lobby.id;
            console.log('🏠 Lobby created with ID:', lobbyID);
            
            // User 2 joins the lobby
            ws2.send(JSON.stringify({
                action: 'join_lobby',
                data: {
                    lobby_id: lobbyID,
                    user_id: user2ID
                }
            }));
        }
    });
    
    ws2.on('message', (data) => {
        const msg = JSON.parse(data);
        console.log('📨 User 2 received:', msg.action);
        
        if (msg.action === 'user_registered') {
            user2ID = msg.user_id;
            console.log('👤 User 2 registered with ID:', user2ID);
        } else if (msg.action === 'lobby_state') {
            console.log('🏠 User 2 joined lobby');
            
            // Now disconnect both users
            setTimeout(() => {
                console.log('🔌 Disconnecting both users...');
                ws1.close();
                ws2.close();
                
                // Wait a moment, then reconnect
                setTimeout(async () => {
                    console.log('🔄 Reconnecting users...');
                    
                    const ws1Reconnect = new WebSocket('ws://localhost:8080/ws');
                    const ws2Reconnect = new WebSocket('ws://localhost:8080/ws');
                    
                    ws1Reconnect.on('open', () => {
                        console.log('✅ User 1 reconnected');
                        ws1Reconnect.send(JSON.stringify({
                            action: 'register_user',
                            data: { username: 'alice' }
                        }));
                    });
                    
                    ws2Reconnect.on('open', () => {
                        console.log('✅ User 2 reconnected');
                        ws2Reconnect.send(JSON.stringify({
                            action: 'register_user',
                            data: { username: 'bob' }
                        }));
                    });
                    
                    ws1Reconnect.on('message', (data) => {
                        const msg = JSON.parse(data);
                        console.log('📨 User 1 reconnected received:', msg.action);
                        
                        if (msg.action === 'lobby_state') {
                            user1Reconnected = true;
                            console.log('✅ User 1 automatically rejoined lobby!');
                            
                            // Check if both users are back
                            if (user1Reconnected && user2Reconnected) {
                                console.log('🎉 Auto-reconnection test PASSED!');
                                ws1Reconnect.close();
                                ws2Reconnect.close();
                                process.exit(0);
                            }
                        }
                    });
                    
                    ws2Reconnect.on('message', (data) => {
                        const msg = JSON.parse(data);
                        console.log('📨 User 2 reconnected received:', msg.action);
                        
                        if (msg.action === 'lobby_state') {
                            user2Reconnected = true;
                            console.log('✅ User 2 automatically rejoined lobby!');
                            
                            // Check if both users are back
                            if (user1Reconnected && user2Reconnected) {
                                console.log('🎉 Auto-reconnection test PASSED!');
                                ws1Reconnect.close();
                                ws2Reconnect.close();
                                process.exit(0);
                            }
                        }
                    });
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        console.log('⏰ Test timed out');
                        ws1Reconnect.close();
                        ws2Reconnect.close();
                        process.exit(1);
                    }, 10000);
                    
                }, 1000);
            }, 1000);
        }
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
        console.log('⏰ Test timed out');
        ws1.close();
        ws2.close();
        process.exit(1);
    }, 15000);
}

// Run the test
testAutoReconnection().catch(console.error); 