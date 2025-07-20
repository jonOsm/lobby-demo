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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Available Lobbies</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {!isRegistered && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            Please register a user first before joining lobbies.
          </p>
          <p className="text-xs text-yellow-700">
            💡 Tip: Use the "Register User" form on the right to create an account.
          </p>
        </div>
      )}

      {lobbies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No lobbies available</p>
          <p className="text-sm">Create a new lobby to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lobbies.map((lobbyId) => (
            <div
              key={lobbyId}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedLobby === lobbyId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedLobby(lobbyId)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">{lobbyId}</h3>
                  <p className="text-sm text-gray-500">Click to join</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(lobbyId);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    View Details
                  </button>
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Available
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLobby && isRegistered && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
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
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please register a user first before joining lobbies.
          </p>
        </div>
      )}

      {/* Lobby Details Display */}
      {lobbyInfo && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {lobbyInfo.name} Details
            </h3>
            <button
              onClick={() => onGetLobbyInfo('')}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`text-sm px-2 py-1 rounded ${
                lobbyInfo.state === 'waiting' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : lobbyInfo.state === 'in_game'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {lobbyInfo.state === 'waiting' ? 'Waiting' : 
                 lobbyInfo.state === 'in_game' ? 'In Game' : 'Finished'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Players:</span>
              <span className="text-sm text-gray-800">
                {lobbyInfo.players.length}/{lobbyInfo.maxPlayers}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm text-gray-800">
                {lobbyInfo.public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          {lobbyInfo.players.length > 0 ? (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Players:</h4>
              <div className="space-y-1">
                {lobbyInfo.players.map((player: any) => (
                  <div key={player.user_id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-800">{player.username}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      player.ready 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {player.ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 text-center">
                No players yet. Be the first to join!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 