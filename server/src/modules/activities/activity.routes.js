/**
 * @FILE: activity.routes.js
 * @RESPONSIBILITY: Express routes wiring volunteer task creation, Kanban board data, drag-and-drop stage updates, and assignments to /api/v1/activities.
 * @DEPENDENCIES: express, activity.controller.js, activity.validation.js, schemaValidator.js, authenticationGate.js, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: activityRouter endpoint registrations.
 * @AUTHOR: Garima Mittal
 */

import express from 'express';
import {
  handleCreateTask,
  handleGetKanbanBoard,
  handleTransitionKanbanStage,
  handleAssignVolunteers,
  handleListAllTasks
} from './activity.controller.js';
import {
  ActivityTaskCreationSchema,
  KanbanStageTransitionSchema,
  AssignVolunteersSchema
} from './activity.validation.js';
import { validateRequestBody } from '../../middleware/schemaValidator.js';
import { authenticateSessionToken } from '../../middleware/authenticationGate.js';
import { authorizeRoleTiers, ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const activityRouter = express.Router();

activityRouter.use(authenticateSessionToken);

activityRouter.get('/kanban', handleGetKanbanBoard);

activityRouter.get('/', handleListAllTasks);

activityRouter.post(
  '/',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(ActivityTaskCreationSchema),
  handleCreateTask
);

activityRouter.put(
  '/:taskId/stage',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(KanbanStageTransitionSchema),
  handleTransitionKanbanStage
);

activityRouter.put(
  '/:taskId/assign',
  authorizeRoleTiers(ERP_USER_ROLES.ADMIN, ERP_USER_ROLES.OPERATIONS),
  validateRequestBody(AssignVolunteersSchema),
  handleAssignVolunteers
);
