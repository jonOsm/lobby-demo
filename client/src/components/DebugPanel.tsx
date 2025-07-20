import React from 'react';

interface DebugPanelProps {
  isConnected: boolean;
  isRegistered: boolean;
  userId: string | null;
  username: string;
  currentLobby: any;
  error: string | null;
  onReRegister?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isConnected,
  isRegistered,
  userId,
  username,
  currentLobby,
  error,
  onReRegister,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
        >
          🔧 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">WebSocket:</span>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Registered:</span>
          <span className={isRegistered ? 'text-green-600' : 'text-red-600'}>
            {isRegistered ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">User ID:</span>
          <span className="text-gray-800 font-mono text-xs">
            {userId ? userId.substring(0, 8) + '...' : 'None'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Username:</span>
          <span className="text-gray-800">{username || 'None'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">In Lobby:</span>
          <span className={currentLobby ? 'text-green-600' : 'text-gray-500'}>
            {currentLobby ? 'Yes' : 'No'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <span className="text-red-800 text-xs">Error: {error}</span>
          </div>
        )}
        
        {onReRegister && !isRegistered && (
          <div className="mt-3">
            <button
              onClick={onReRegister}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              🔄 Re-register User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 