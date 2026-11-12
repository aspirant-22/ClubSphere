/**
 * @FILE: activity.controller.js
 * @RESPONSIBILITY: Express controllers handling volunteer task instantiation, Kanban drag-and-drop state transitions, and board aggregations.
 * @DEPENDENCIES: activity.service.js, activity.model.js.
 * @MODIFICATION_HOTSPOT: handleTransitionKanbanStage and handleGetKanbanBoard.
 * @AUTHOR: Garima Mittal
 */

import {
  createVolunteerTaskRecord,
  transitionKanbanStage,
  updateTaskVolunteers,
  fetchProjectKanbanBoardData
} from './activity.service.js';
import { ActivityTaskModel } from './activity.model.js';

export const handleCreateTask = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const creatorUserId = incomingHttpRequest.authenticatedUser.userId;
    const createdTask = await createVolunteerTaskRecord(incomingHttpRequest.body, creatorUserId);

    return outgoingHttpResponse.status(201).json({
      successIndicator: true,
      statusMessage: 'Volunteer task added to backlog.',
      taskRecord: createdTask
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return outgoingHttpResponse.status(statusCode).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleGetKanbanBoard = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const projectName = incomingHttpRequest.query.project;
    const boardData = await fetchProjectKanbanBoardData(projectName);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      boardData
    });
  } catch (error) {
    return outgoingHttpResponse.status(500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleTransitionKanbanStage = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const taskId = incomingHttpRequest.params.taskId;
    const { destinationStage, transitionRemarks } = incomingHttpRequest.body;

    const updatedTask = await transitionKanbanStage(taskId, destinationStage, transitionRemarks);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: `Task transitioned to ${destinationStage}`,
      taskRecord: updatedTask
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleAssignVolunteers = async (incomingHttpRequest, outgoingHttpResponse) => {
  try {
    const taskId = incomingHttpRequest.params.taskId;
    const { volunteerUserIds } = incomingHttpRequest.body;

    const updatedTask = await updateTaskVolunteers(taskId, volunteerUserIds);

    return outgoingHttpResponse.status(200).json({
      successIndicator: true,
      statusMessage: 'Volunteer assignees updated.',
      taskRecord: updatedTask
    });
  } catch (error) {
    return outgoingHttpResponse.status(error.statusCode || 500).json({
      successIndicator: false,
      errorSummaryMessage: error.message
    });
  }
};

export const handleListAllTasks = async (incomingHttpRequest, outgoingHttpResponse) => {
  const allTasks = await ActivityTaskModel.find()
    .populate('assignedVolunteerUserIds', 'fullName emailAddress studentIdentificationNumber')
    .sort({ createdAt: -1 });

  return outgoingHttpResponse.status(200).json({
    successIndicator: true,
    totalTasksCount: allTasks.length,
    tasksList: allTasks
  });
};

