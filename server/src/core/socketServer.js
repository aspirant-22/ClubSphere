/**
 * @FILE: socketServer.js
 * @RESPONSIBILITY: Real-time WebSocket event dispatcher and Socket.IO gateway initialization wrapper.
 * @DEPENDENCIES: socket.io
 * @MODIFICATION_HOTSPOT: initializeSocketServer and broadcastDomainEvent.
 * @AUTHOR: Garima Mittal
 */

import { Server as SocketIoServer } from 'socket.io';

let activeSocketServer = null;

export const initializeSocketServer = (httpServerInstance, allowedOrigins = ['http://localhost:5173']) => {
  activeSocketServer = new SocketIoServer(httpServerInstance, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  activeSocketServer.on('connection', (clientSocket) => {
    console.log(`[Socket Gateway]: Real-time client connected: ${clientSocket.id}`);

    clientSocket.on('subscribe_channel', (channelName) => {
      clientSocket.join(channelName);
      console.log(`[Socket Gateway]: Socket ${clientSocket.id} joined channel ${channelName}`);
    });

    clientSocket.on('disconnect', () => {
      console.log(`[Socket Gateway]: Real-time client disconnected: ${clientSocket.id}`);
    });
  });

  return activeSocketServer;
};

export const getSocketServerInstance = () => {
  return activeSocketServer;
};

export const broadcastDomainEvent = (eventName, eventPayload, targetRoom = null) => {
  if (!activeSocketServer) {
    return;
  }
  if (targetRoom) {
    activeSocketServer.to(targetRoom).emit(eventName, eventPayload);
  } else {
    activeSocketServer.emit(eventName, eventPayload);
  }
};

