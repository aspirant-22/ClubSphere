/**
 * @FILE: VolunteerKanbanView.jsx
 * @RESPONSIBILITY: Interactive 5-column Odoo Kanban board for Bake Sale Fundraiser with stage transitions and budget metrics.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, ControlPanelHeader.jsx, TaskCreationModal.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Kanban columns, advance stage trigger, and budget progress.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { TaskCreationModal } from './TaskCreationModal.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

const STAGE_ORDER = ['BACKLOG', 'TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

const STAGE_LABELS = {
  BACKLOG: 'Backlog',
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Done'
};

export const VolunteerKanbanView = () => {
  const [boardData, setBoardData] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { runWithProcessingLock } = useSystemProcessing();
  const { isAdminOrOperations } = useAuthentication();

  const loadBoardData = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/activities/kanban?project=Bake%20Sale%20Fundraiser');
      if (response.data?.successIndicator) {
        setBoardData(response.data.boardData);
      }
    } catch (err) {
      console.error('Failed to load Kanban board:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, []);

  const handleAdvanceStage = async (taskId, currentStage) => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) return;

    const nextStage = STAGE_ORDER[currentIndex + 1];
    try {
      await runWithProcessingLock(async () => {
        await apiNetworkClient.put(`/activities/${taskId}/stage`, {
          destinationStage: nextStage
        });
        await loadBoardData();
      }, `Moving task to ${STAGE_LABELS[nextStage]}...`);
    } catch (err) {
      console.error('Failed to transition stage:', err);
    }
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Activities', path: '/activities' },
    { label: 'Bake Sale Fundraiser Kanban' }
  ];

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {isAdminOrOperations() && (
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="btn-primary-action flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      )}
    </div>
  );

  return (
    <div
      data-component="VolunteerKanbanView"
      data-purpose="volunteer-task-kanban"
      className="flex flex-col h-full bg-slate-100"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      {/* Project Status Bar */}
      {boardData && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-odoo-border text-xs shrink-0">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-slate-800 text-sm">{boardData.projectName}</span>
            <div className="flex items-center space-x-1.5 text-2xs text-slate-500 font-semibold">
              <span>Progress:</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${boardData.projectCompletionRate}%` }}
                />
              </div>
              <span className="font-mono text-emerald-700">{boardData.projectCompletionRate}%</span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-2xs text-slate-600 font-medium">
            <span>Total Tasks: <strong className="text-slate-900">{boardData.totalTasksCount}</strong></span>
            <span>Allocated Budget: <strong className="text-odoo-primary">₹{boardData.totalAllocatedBudgetSum}</strong></span>
          </div>
        </div>
      )}

      {/* 5-Column Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto flex space-x-3.5">
        {STAGE_ORDER.map((stageKey) => {
          const tasksInColumn = boardData?.kanbanColumns?.[stageKey] || [];
          return (
            <div
              key={stageKey}
              className="w-72 bg-slate-200/70 rounded-lg flex flex-col shrink-0 max-h-full border border-slate-300/60"
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-300/80 bg-slate-200/90 rounded-t-lg">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {STAGE_LABELS[stageKey]}
                </span>
                <span className="text-2xs font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-300">
                  {tasksInColumn.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                {tasksInColumn.map((task) => (
                  <div
                    key={task._id}
                    className="bg-white p-3 rounded-md border border-slate-200 shadow-xs hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xs font-mono font-bold text-slate-500">
                        {task.activityTrackingCode}
                      </span>
                      <span className="px-1.5 py-0.2 text-2xs font-bold uppercase rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {task.taskCategory?.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.taskTitle}</h4>
                    {task.taskDescription && (
                      <p className="text-2xs text-slate-500 line-clamp-2">{task.taskDescription}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-2xs text-slate-500">
                      <span className="font-semibold text-slate-700">Budget: ₹{task.allocatedBudgetCap}</span>
                      {stageKey !== 'COMPLETED' && isAdminOrOperations() && (
                        <button
                          onClick={() => handleAdvanceStage(task._id, task.kanbanStage)}
                          className="flex items-center space-x-1 text-odoo-primary hover:text-odoo-primaryHover font-bold group"
                          title="Advance stage"
                        >
                          <span>Move</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <TaskCreationModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => loadBoardData()}
      />
    </div>
  );
};

