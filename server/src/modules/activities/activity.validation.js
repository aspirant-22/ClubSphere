/**
 * @FILE: activity.validation.js
 * @RESPONSIBILITY: Zod validation schemas for volunteer task instantiation, assignee updates, and Kanban drag-and-drop state transitions.
 * @DEPENDENCIES: zod, activity.model.js.
 * @MODIFICATION_HOTSPOT: ActivityTaskCreationSchema and KanbanStageTransitionSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { TASK_CATEGORIES, TASK_PRIORITIES } from './activity.model.js';

export const SubtaskItemInputSchema = z.object({
  subtaskTitle: z.string().min(2).max(150),
  isSubtaskCompleted: z.boolean().default(false)
});

export const ActivityTaskCreationSchema = z.object({
  projectName: z.string().min(2).max(100).default('Bake Sale Fundraiser'),
  taskTitle: z.string().min(3, 'Task title must be at least 3 characters').max(120),
  taskDescription: z.string().max(1000).optional(),
  taskCategory: z.enum([
    TASK_CATEGORIES.BAKING_PRODUCTION,
    TASK_CATEGORIES.SUPPLIES_LOGISTICS,
    TASK_CATEGORIES.TABLE_MANAGEMENT,
    TASK_CATEGORIES.MARKETING_OUTREACH
  ]),
  priorityLevel: z.enum([
    TASK_PRIORITIES.LOW,
    TASK_PRIORITIES.MEDIUM,
    TASK_PRIORITIES.HIGH,
    TASK_PRIORITIES.CRITICAL
  ]).default(TASK_PRIORITIES.MEDIUM),
  assignedVolunteerUserIds: z.array(z.string()).optional(),
  allocatedBudgetCap: z.number().min(0, 'Budget cap must be zero or positive').default(0),
  targetCompletionDate: z.string().datetime(),
  subtaskLines: z.array(SubtaskItemInputSchema).optional()
});

export const KanbanStageTransitionSchema = z.object({
  destinationStage: z.enum(['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
  transitionRemarks: z.string().max(200).optional()
});

export const AssignVolunteersSchema = z.object({
  volunteerUserIds: z.array(z.string()).min(1, 'At least one volunteer required')
});
