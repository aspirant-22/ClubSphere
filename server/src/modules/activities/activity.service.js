/**
 * @FILE: activity.service.js
 * @RESPONSIBILITY: Business logic for volunteer task kanban pipelines, stage updates, assignee management, and fundraiser budget tracking.
 * @DEPENDENCIES: activity.model.js, sequenceRegistry.js.
 * @MODIFICATION_HOTSPOT: createVolunteerTaskRecord and transitionKanbanStage.
 * @AUTHOR: Garima Mittal
 */

import { ActivityTaskModel, KANBAN_STAGES } from './activity.model.js';
import { generateNextSequenceCode } from '../../core/sequenceRegistry.js';

export const createVolunteerTaskRecord = async (taskData, creatorUserId) => {
  const generatedActivityCode = await generateNextSequenceCode('ACT');

  const createdTask = await ActivityTaskModel.create({
    activityTrackingCode: generatedActivityCode,
    projectName: taskData.projectName || 'Bake Sale Fundraiser',
    taskTitle: taskData.taskTitle,
    taskDescription: taskData.taskDescription,
    taskCategory: taskData.taskCategory,
    kanbanStage: 'BACKLOG',
    priorityLevel: taskData.priorityLevel,
    assignedVolunteerUserIds: taskData.assignedVolunteerUserIds || [],
    allocatedBudgetCap: taskData.allocatedBudgetCap || 0,
    targetCompletionDate: new Date(taskData.targetCompletionDate),
    subtaskLines: taskData.subtaskLines || [],
    createdByUserId: creatorUserId
  });

  console.log(`[Activity Service]: Created volunteer task ${generatedActivityCode}: ${taskData.taskTitle}`);
  return createdTask;
};

export const transitionKanbanStage = async (taskId, destinationStage, remarksString) => {
  const targetTask = await ActivityTaskModel.findById(taskId);
  if (!targetTask) {
    const error = new Error('Volunteer task not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!KANBAN_STAGES.includes(destinationStage)) {
    const error = new Error(`Invalid target kanban stage: ${destinationStage}`);
    error.statusCode = 400;
    throw error;
  }

  const previousStage = targetTask.kanbanStage;
  targetTask.kanbanStage = destinationStage;
  await targetTask.save();

  console.log(`[Kanban Service]: Task ${targetTask.activityTrackingCode} moved: ${previousStage} -> ${destinationStage}. Remarks: ${remarksString || 'None'}`);
  return targetTask;
};

export const updateTaskVolunteers = async (taskId, volunteerUserIds) => {
  const targetTask = await ActivityTaskModel.findById(taskId);
  if (!targetTask) {
    const error = new Error('Volunteer task not found.');
    error.statusCode = 404;
    throw error;
  }

  targetTask.assignedVolunteerUserIds = volunteerUserIds;
  await targetTask.save();
  console.log(`[Kanban Service]: Reassigned volunteers for ${targetTask.activityTrackingCode}`);
  return targetTask;
};

export const fetchProjectKanbanBoardData = async (projectNameQuery) => {
  const targetProject = projectNameQuery || 'Bake Sale Fundraiser';
  const allProjectTasks = await ActivityTaskModel.find({ projectName: targetProject })
    .populate('assignedVolunteerUserIds', 'fullName emailAddress studentIdentificationNumber')
    .populate('createdByUserId', 'fullName emailAddress')
    .sort({ targetCompletionDate: 1 });

  const kanbanColumnsMap = {};
  for (const stageName of KANBAN_STAGES) {
    kanbanColumnsMap[stageName] = [];
  }

  let totalAllocatedBudgetSum = 0;
  for (const task of allProjectTasks) {
    kanbanColumnsMap[task.kanbanStage].push(task);
    totalAllocatedBudgetSum += task.allocatedBudgetCap;
  }

  const totalTasksCount = allProjectTasks.length;
  const completedTasksCount = kanbanColumnsMap['COMPLETED'].length;
  const projectCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return {
    projectName: targetProject,
    totalTasksCount,
    completedTasksCount,
    projectCompletionRate,
    totalAllocatedBudgetSum,
    kanbanColumns: kanbanColumnsMap
  };
};

