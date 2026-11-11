/**
 * @FILE: auth.routes.js
 * @RESPONSIBILITY: Express router endpoints for registration, authentication, logout, and profile discovery.
 * @DEPENDENCIES: express, auth.controller.js, auth.validation.js, schemaValidator.js, authenticationGate.js.
 * @MODIFICATION_HOTSPOT: authRouter endpoint bindings.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleFetchAuthenticatedUserProfile
} from './auth.controller.js';
import { UserRegistrationSchema, UserLoginSchema } from './auth.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';

export const authRouter = express.Router();

authRouter.post(
  '/register',
  validateRequestBody(UserRegistrationSchema),
  handleUserRegistration
);

authRouter.post(
  '/login',
  validateRequestBody(UserLoginSchema),
  handleUserLogin
);

authRouter.post(
  '/logout',
  authenticateSessionToken,
  handleUserLogout
);

authRouter.get(
  '/me',
  authenticateSessionToken,
  handleFetchAuthenticatedUserProfile
);
