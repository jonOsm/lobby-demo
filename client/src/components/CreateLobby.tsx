import React from 'react';

interface CreateLobbyProps {
  onCreateLobby: (name: string, maxPlayers: number, isPublic: boolean, creatorUsername: string) => void;
  isLoading?: boolean;
}

export const CreateLobby: React.FC<CreateLobbyProps> = ({
  onCreateLobby,
  isLoading = false,
}) => {
  const [name, setName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [maxPlayers, setMaxPlayers] = React.useState(4);
  const [isPublic, setIsPublic] = React.useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && username.trim() && maxPlayers > 0) {
      onCreateLobby(name.trim(), maxPlayers, isPublic, username.trim());
      setName('');
      setUsername('');
      setMaxPlayers(4);
      setIsPublic(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Lobby</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Your Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="lobby-name" className="block text-sm font-medium text-gray-700 mb-1">
            Lobby Name
          </label>
          <input
            id="lobby-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter lobby name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="max-players" className="block text-sm font-medium text-gray-700 mb-1">
            Max Players
          </label>
          <select
            id="max-players"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2}>2 Players</option>
            <option value={3}>3 Players</option>
            <option value={4}>4 Players</option>
            <option value={5}>5 Players</option>
            <option value={6}>6 Players</option>
            <option value={8}>8 Players</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="public-lobby"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="public-lobby" className="ml-2 block text-sm text-gray-700">
            Public lobby (visible to everyone)
          </label>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !username.trim() || isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Lobby'}
        </button>
      </form>
    </div>
  );
}; 