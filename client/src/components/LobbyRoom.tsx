import React from 'react';
import type { Lobby } from '../types/lobby';

interface LobbyRoomProps {
  lobby: Lobby;
  currentUsername: string;
  onLeaveLobby: (lobbyId: string, username: string) => void;
  onSetReady: (lobbyId: string, username: string, ready: boolean) => void;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({
  lobby,
  currentUsername,
  onLeaveLobby,
  onSetReady,
}) => {
  const currentPlayer = lobby.players.find(p => p.username === currentUsername);
  const allReady = lobby.players.length > 0 && lobby.players.every(p => p.ready);

  const handleReadyToggle = () => {
    if (currentPlayer) {
      onSetReady(lobby.id, currentUsername, !currentPlayer.ready);
    }
  };

  const handleLeave = () => {
    onLeaveLobby(lobby.id, currentUsername);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{lobby.name}</h2>
          <p className="text-gray-600">
            {lobby.players.length}/{lobby.maxPlayers} Players
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-3 py-1 text-sm rounded-full ${
            lobby.state === 'waiting' 
              ? 'bg-yellow-100 text-yellow-800' 
              : lobby.state === 'in_game'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {lobby.state === 'waiting' ? 'Waiting' : 
             lobby.state === 'in_game' ? 'In Game' : 'Finished'}
          </span>
        </div>
      </div>

      {/* Players List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Players</h3>
        <div className="space-y-2">
          {lobby.players.map((player) => (
            <div
              key={player.username}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {player.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-800">
                  {player.username}
                  {player.username === currentUsername && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  player.ready 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {player.ready ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ready Status */}
      {currentPlayer && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Status:</p>
              <p className="font-medium text-gray-800">
                {currentPlayer.ready ? 'Ready to play!' : 'Not ready'}
              </p>
            </div>
            <button
              onClick={handleReadyToggle}
              className={`px-4 py-2 rounded font-medium ${
                currentPlayer.ready
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
      {allReady && lobby.players.length >= 2 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center">
            <span className="text-green-800 font-medium">
              🎮 All players are ready! Game can start.
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Leave Lobby
        </button>
        
        {allReady && lobby.players.length >= 2 && (
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}; 