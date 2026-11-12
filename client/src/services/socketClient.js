/**
 * @FILE: socketClient.js
 * @RESPONSIBILITY: Client-side Socket.IO client factory and singleton connection manager.
 * @DEPENDENCIES: socket.io-client.
 * @MODIFICATION_HOTSPOT: getSocketClient connection settings.
 * @AUTHOR: Garima Mittal
 */

import { io } from 'socket.io-client';

let socketClientInstance = null;

export const getSocketClient = () => {
  if (!socketClientInstance) {
    socketClientInstance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socketClientInstance.on('connect_error', (error) => {
      console.warn('[Socket Client]: Connection error:', error.message);
    });
  }

  return socketClientInstance;
};

export const disconnectSocketClient = () => {
  if (socketClientInstance) {
    socketClientInstance.disconnect();
    socketClientInstance = null;
  }
};

