import React from 'react';

interface LobbyListProps {
  lobbies: string[];
  onJoinLobby: (lobbyId: string, username: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const LobbyList: React.FC<LobbyListProps> = ({
  lobbies,
  onJoinLobby,
  onRefresh,
  isLoading = false,
}) => {
  const [selectedLobby, setSelectedLobby] = React.useState<string>('');
  const [username, setUsername] = React.useState('');

  const handleJoin = () => {
    if (selectedLobby && username.trim()) {
      onJoinLobby(selectedLobby, username.trim());
      setSelectedLobby('');
      setUsername('');
    }
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
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Available
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLobby && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Join <span className="font-medium">{selectedLobby}</span> as:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 