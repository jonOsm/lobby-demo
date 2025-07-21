import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { LobbyList } from './components/LobbyList';
import { CreateLobby } from './components/CreateLobby';
import { LobbyRoom } from './components/LobbyRoom';
import { DebugPanel } from './components/DebugPanel';
import './App.css';

function App() {
  const {
    isConnected,
    lobbies,
    currentLobby,
    lobbyInfo,
    username,
    userId,
    error,
    isRegistered,
    registerUser,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
    getLobbyInfo,
    listLobbies,
    setUsername,
    isLeavingLobby,
    logout,
  } = useWebSocket();

  // Load lobbies on connection
  useEffect(() => {
    if (isConnected) {
      listLobbies();
    }
  }, [isConnected, listLobbies]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Logout button at top right */}
      {isRegistered && (
        <button
          onClick={logout}
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow"
        >
          Logout{username ? ` (${username})` : ''}
        </button>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Multiplayer Lobby</h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            {isRegistered && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Logged in as:</span>
                <span className="text-sm font-medium text-gray-800">{username}</span>
                <span className="text-xs text-gray-500">({userId?.substring(0, 8)}...)</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentLobby ? (
          // Show lobby room when in a lobby
          <div className="max-w-2xl mx-auto">
            <LobbyRoom
              lobby={currentLobby}
              currentUserId={userId}
              onLeaveLobby={leaveLobby}
              onSetReady={setReady}
              onStartGame={startGame}
              isLeavingLobby={isLeavingLobby}
            />
          </div>
        ) : (
          // Show lobby list and create form when not in a lobby
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <LobbyList
                lobbies={lobbies}
                lobbyInfo={lobbyInfo}
                isRegistered={isRegistered}
                onJoinLobby={joinLobby}
                onGetLobbyInfo={getLobbyInfo}
                onRefresh={listLobbies}
                isLoading={!isConnected}
              />
            </div>
            <div>
              <CreateLobby
                onCreateLobby={createLobby}
                onRegisterUser={registerUser}
                isRegistered={isRegistered}
                isLoading={!isConnected}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Multiplayer Lobby Demo - Built with React, TypeScript, and Go
          </p>
        </div>
      </footer>
      
      {/* Debug Panel */}
      <DebugPanel
        isConnected={isConnected}
        isRegistered={isRegistered}
        userId={userId}
        username={username}
        currentLobby={currentLobby}
        error={error}
        onReRegister={() => {
          const storedUsername = localStorage.getItem('lobby_username');
          if (storedUsername) {
            registerUser(storedUsername);
          }
        }}
      />
    </div>
  );
}

export default App;
