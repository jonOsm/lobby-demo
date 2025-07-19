import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { LobbyList } from './components/LobbyList';
import { CreateLobby } from './components/CreateLobby';
import { LobbyRoom } from './components/LobbyRoom';
import './App.css';

function App() {
  const {
    isConnected,
    lobbies,
    currentLobby,
    username,
    error,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    listLobbies,
    setUsername,
  } = useWebSocket();

  // Load lobbies on connection
  useEffect(() => {
    if (isConnected) {
      listLobbies();
    }
  }, [isConnected, listLobbies]);

  return (
    <div className="min-h-screen bg-gray-100">
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
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentLobby ? (
          // Show lobby room when in a lobby
          <div className="max-w-2xl mx-auto">
            <LobbyRoom
              lobby={currentLobby}
              currentUsername={username}
              onLeaveLobby={leaveLobby}
              onSetReady={setReady}
            />
          </div>
        ) : (
          // Show lobby list and create form when not in a lobby
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <LobbyList
                lobbies={lobbies}
                username={username}
                onJoinLobby={joinLobby}
                onRefresh={listLobbies}
                isLoading={!isConnected}
              />
            </div>
            <div>
              <CreateLobby
                onCreateLobby={createLobby}
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
    </div>
  );
}

export default App;
