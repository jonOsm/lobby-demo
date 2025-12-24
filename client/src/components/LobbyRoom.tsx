import React from 'react';
import type { Lobby } from '../types/lobby';

interface LobbyRoomProps {
  lobby: Lobby;
  currentUserId: string | null;
  onLeaveLobby: (lobbyId: string) => void;
  onSetReady: (lobbyId: string, ready: boolean) => void;
  onStartGame: (lobbyId: string) => void;
  isLeavingLobby?: boolean;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  lobby,
  currentUserId,
  onLeaveLobby,
  onSetReady,
  onStartGame,
  isLeavingLobby = false,
}) => {
  const currentPlayer = currentUserId ? lobby.players.find(p => p.user_id === currentUserId) : null;
  const allReady = lobby.players.length > 0 && lobby.players.every(p => p.ready);

  const handleReadyToggle = () => {
    if (currentPlayer && currentUserId) {
      onSetReady(lobby.id, !currentPlayer.ready);
    }
  };

  const handleLeave = () => {
    onLeaveLobby(lobby.id);
  };

  const handleStartGame = () => {
    onStartGame(lobby.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{lobby.name}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {lobby.players.length}/{lobby.maxPlayers} Players
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 text-sm rounded-full ${lobby.state === 'waiting'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
            : lobby.state === 'in_game'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
            }`}>
            {lobby.state === 'waiting' ? 'Waiting' :
              lobby.state === 'in_game' ? 'In Game' : 'Finished'}
          </span>
        </div>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Players</h3>
        <div className="space-y-2">
          {lobby.players.map((player) => (
            <div
              key={player.user_id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {player.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-800 dark:text-white">
                  {player.username}
                  {player.user_id === currentUserId && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${player.ready
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                  {player.ready ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready Status - only show when waiting */}
      {currentPlayer && lobby.state === 'waiting' && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your Status:</p>
              <p className="font-medium text-gray-800 dark:text-white">
                {currentPlayer.ready ? 'Ready to play!' : 'Not ready'}
              </p>
            </div>
            <button
              onClick={handleReadyToggle}
              className={`px-4 py-2 rounded font-medium ${currentPlayer.ready
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
                }`}
            >
              {currentPlayer.ready ? 'Not Ready' : 'Ready'}
            </button>
          </div>
        </div>
      )}

      {/* Game Start Status */}
      {allReady && lobby.players.length >= 2 && lobby.state === 'waiting' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-center">
            <span className="text-green-800 dark:text-green-200 font-medium">
              🎮 All players are ready! Game can start.
            </span>
          </div>
        </div>
      )}

      {/* Game In Progress Status */}
      {lobby.state === 'in_game' && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-purple-800 dark:text-purple-200 font-medium">
              🎮 Game is in progress!
            </span>
            <span className="text-sm text-purple-600 dark:text-purple-300">
              This is a multiplayer lobby demo — no actual game is implemented.
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handleLeave}
          disabled={isLeavingLobby}
          className={`px-4 py-2 rounded ${isLeavingLobby
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
            }`}
        >
          {isLeavingLobby ? 'Leaving...' : 'Leave Lobby'}
        </button>

        {allReady && lobby.players.length >= 2 && lobby.state === 'waiting' && currentPlayer?.can_start_game && (
          <button
            onClick={handleStartGame}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}; 