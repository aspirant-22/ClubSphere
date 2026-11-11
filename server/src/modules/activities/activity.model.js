/**
 * @FILE: activity.model.js
 * @RESPONSIBILITY: Mongoose Activity schema modeling volunteer tasks, kanban columns, subtasks, and budget allocations for fundraisers.
 * @DEPENDENCIES: mongoose.
 * @MODIFICATION_HOTSPOT: KANBAN_STAGES, TASK_CATEGORIES, and activityTaskSchema definitions.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';

export const KANBAN_STAGES = [
  'BACKLOG',
  'TO_DO',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED'
];

export const TASK_CATEGORIES = {
  BAKING_PRODUCTION: 'BAKING_PRODUCTION',
  SUPPLIES_LOGISTICS: 'SUPPLIES_LOGISTICS',
  TABLE_MANAGEMENT: 'TABLE_MANAGEMENT',
  MARKETING_OUTREACH: 'MARKETING_OUTREACH'
};

export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

const subtaskLineItemSchema = new mongoose.Schema(
  {
    subtaskTitle: {
      type: String,
      required: true,
      trim: true
    },
    isSubtaskCompleted: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const activityTaskSchema = new mongoose.Schema(
  {
    activityTrackingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
      default: 'Bake Sale Fundraiser'
    },
    taskTitle: {
      type: String,
      required: true,
      trim: true
    },
    taskDescription: {
      type: String,
      trim: true
    },
    taskCategory: {
      type: String,
      required: true,
      enum: Object.values(TASK_CATEGORIES),
      default: TASK_CATEGORIES.BAKING_PRODUCTION
    },
    kanbanStage: {
      type: String,
      required: true,
      enum: KANBAN_STAGES,
      default: 'BACKLOG',
      index: true
    },
    priorityLevel: {
      type: String,
      required: true,
      enum: Object.values(TASK_PRIORITIES),
      default: TASK_PRIORITIES.MEDIUM
    },
    assignedVolunteerUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    allocatedBudgetCap: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    targetCompletionDate: {
      type: Date,
      required: true
    },
    subtaskLines: {
      type: [subtaskLineItemSchema],
      default: []
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'activities'
  }
);

export const ActivityTaskModel = mongoose.model('ActivityTask', activityTaskSchema);
