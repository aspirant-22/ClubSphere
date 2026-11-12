/**
 * @FILE: SocketNotificationContext.jsx
 * @RESPONSIBILITY: Global React Context managing live Socket.IO connection and streaming real-time notifications.
 * @DEPENDENCIES: react, socket.io-client.
 * @MODIFICATION_HOTSPOT: socket connection lifecycle and incoming event listeners.
 * @AUTHOR: Garima Mittal
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketNotificationContext = createContext(null);

export const SocketNotificationProvider = ({ children }) => {
  const [socketClient, setSocketClient] = useState(null);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');

  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setConnectionStatus('CONNECTED');
    });

    socketInstance.on('disconnect', () => {
      setConnectionStatus('DISCONNECTED');
    });

    socketInstance.on('BROADCAST_PUBLISHED', (incomingBroadcast) => {
      setLiveNotifications((previousAlerts) => [incomingBroadcast, ...previousAlerts.slice(0, 49)]);
    });

    setSocketClient(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const clearNotifications = () => {
    setLiveNotifications([]);
  };

  const contextValue = {
    socketClient,
    liveNotifications,
    connectionStatus,
    clearNotifications
  };

  return (
    <SocketNotificationContext.Provider value={contextValue}>
      {children}
    </SocketNotificationContext.Provider>
  );
};

export const useSocketNotifications = () => {
  const context = useContext(SocketNotificationContext);
  if (!context) {
    throw new Error('useSocketNotifications must be used within a SocketNotificationProvider');
  }
  return context;
};
