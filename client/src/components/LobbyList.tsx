import React from 'react';

interface LobbyListProps {
  lobbies: string[];
  lobbyInfo: any;
  isRegistered: boolean;
  onJoinLobby: (lobbyId: string) => void;
  onGetLobbyInfo: (lobbyId: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const LobbyList: React.FC<LobbyListProps> = ({
  lobbies,
  lobbyInfo,
  isRegistered,
  onJoinLobby,
  onGetLobbyInfo,
  onRefresh,
  isLoading = false,
}) => {
  const [selectedLobby, setSelectedLobby] = React.useState<string>('');

  const handleJoin = () => {
    if (selectedLobby && isRegistered) {
      onJoinLobby(selectedLobby);
      setSelectedLobby('');
    }
  };

  const handleViewDetails = (lobbyId: string) => {
    onGetLobbyInfo(lobbyId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Available Lobbies</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {!isRegistered && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            Please register a user first before joining lobbies.
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            💡 Tip: Use the "Register User" form on the right to create an account.
          </p>
        </div>
      )}

      {lobbies.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No lobbies available</p>
          <p className="text-sm">Create a new lobby to get started!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {lobbies.map((lobbyId) => (
            <div
              key={lobbyId}
              className={`w-full p-6 border rounded-lg cursor-pointer transition-colors hover:shadow-md ${
                selectedLobby === lobbyId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700'
              }`}
              onClick={() => setSelectedLobby(lobbyId)}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">{lobbyId}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click to join this lobby</p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(lobbyId);
                    }}
                    className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    View Details
                  </button>
                  <span className="inline-block px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                    Available
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLobby && isRegistered && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Join <span className="font-medium">{selectedLobby}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleJoin}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Join Lobby
            </button>
            <button
              onClick={() => setSelectedLobby('')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedLobby && !isRegistered && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Please register a user first before joining lobbies.
          </p>
        </div>
      )}

      {/* Lobby Details Display */}
      {lobbyInfo && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {lobbyInfo.name} Details
            </h3>
            <button
              onClick={() => onGetLobbyInfo('')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Status:</span>
              <span className={`text-sm px-2 py-1 rounded ${
                lobbyInfo.state === 'waiting' 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                  : lobbyInfo.state === 'in_game'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}>
                {lobbyInfo.state === 'waiting' ? 'Waiting' : 
                 lobbyInfo.state === 'in_game' ? 'In Game' : 'Finished'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Players:</span>
              <span className="text-sm text-gray-800 dark:text-white">
                {lobbyInfo.players.length}/{lobbyInfo.maxPlayers}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Type:</span>
              <span className="text-sm text-gray-800 dark:text-white">
                {lobbyInfo.public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          {lobbyInfo.players.length > 0 ? (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Players:</h4>
              <div className="space-y-1">
                {lobbyInfo.players.map((player: any) => (
                  <div key={player.user_id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 dark:text-white">{player.username}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      player.ready 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {player.ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-600 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                No players yet. Be the first to join!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 