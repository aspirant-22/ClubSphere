/**
 * @FILE: server.js
 * @RESPONSIBILITY: Central application gateway bootstrapping Express, Helmet, CORS, Rate-Limiting, Socket.IO, and API modules.
 * @DEPENDENCIES: express, http, socket.io, helmet, cors, cookie-parser, express-rate-limit, databaseConnection.js.
 * @MODIFICATION_HOTSPOT: API route attachments and server listen parameters.
 * @AUTHOR: Garima Mittal
 */

import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server as SocketIoServer } from 'socket.io';
import dotenv from 'dotenv';

import { connectToDatabase } from './config/databaseConnection.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { membershipRouter } from './modules/memberships/membership.routes.js';
import { eventRouter } from './modules/events/event.routes.js';
import { merchandiseRouter } from './modules/merchandise/merchandise.routes.js';
import { activityRouter } from './modules/activities/activity.routes.js';
import { accountingRouter } from './modules/accounting/accounting.routes.js';
import { broadcastRouter } from './modules/broadcasts/broadcast.routes.js';
import { diagnosticRouter } from './modules/diagnostics/diagnostic.routes.js';

dotenv.config();

const expressApplication = express();
const primaryHttpServer = http.createServer(expressApplication);

const allowedClientOrigin = process.env.CLIENT_ORIGIN_URL || 'http://localhost:5173';

const socketIoServer = new SocketIoServer(primaryHttpServer, {
  cors: {
    origin: allowedClientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

expressApplication.use(helmet());
expressApplication.use(
  cors({
    origin: allowedClientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);
expressApplication.use(cookieParser());
expressApplication.use(express.json({ limit: '2mb' }));
expressApplication.use(express.urlencoded({ extended: true, limit: '2mb' }));

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    successIndicator: false,
    errorCodeIdentifier: 'RATE_LIMIT_EXCEEDED',
    errorSummaryMessage: 'Too many requests dispatched to API gateway. Please slow down.'
  }
});
expressApplication.use('/api/', globalRateLimiter);

// Module API Router Attachments
expressApplication.use('/api/v1/auth', authRouter);
expressApplication.use('/api/v1/memberships', membershipRouter);
expressApplication.use('/api/v1/events', eventRouter);
expressApplication.use('/api/v1/merchandise', merchandiseRouter);
expressApplication.use('/api/v1/activities', activityRouter);
expressApplication.use('/api/v1/accounting', accountingRouter);
expressApplication.use('/api/v1/broadcasts', broadcastRouter);
expressApplication.use('/api/v1/diagnostics', diagnosticRouter);

expressApplication.get('/api/health', (incomingHttpRequest, outgoingHttpResponse) => {
  return outgoingHttpResponse.status(200).json({
    systemStatus: 'ONLINE',
    serverNodeTimestamp: new Date().toISOString(),
    organizationScope: 'Skyline Student Association'
  });
});

socketIoServer.on('connection', (connectedClientSocket) => {
  console.log(`[Socket Gateway]: Real-time client connected: ${connectedClientSocket.id}`);
  connectedClientSocket.on('disconnect', () => {
    console.log(`[Socket Gateway]: Client disconnected: ${connectedClientSocket.id}`);
  });
});

export { expressApplication, primaryHttpServer, socketIoServer };

const PORT_NUMBER = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectToDatabase()
    .then(() => {
      primaryHttpServer.listen(PORT_NUMBER, () => {
        console.log(`[Express Gateway]: ClubSphere Enterprise API running on port ${PORT_NUMBER}`);
        console.log(`[Security Headers]: Helmet, CORS whitelist (${allowedClientOrigin}), HTTP-Only Cookies active.`);
      });
    })
    .catch((bootstrapStartupError) => {
      console.error(`[Bootstrap Failure]: Critical server termination: ${bootstrapStartupError.message}`);
    });
}

