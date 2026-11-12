/**
 * @FILE: TaskCreationModal.jsx
 * @RESPONSIBILITY: Modal for adding new fundraiser volunteer tasks with category tags, member assignments, and budget allocations.
 * @DEPENDENCIES: react, lucide-react, apiNetworkClient.js, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Task form fields and submission payload.
 * @AUTHOR: Garima Mittal
 */

import React, { useState } from 'react';
import { X, CheckSquare, Plus, DollarSign, Calendar } from 'lucide-react';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const TaskCreationModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [taskData, setTaskData] = useState({
    projectName: 'Bake Sale Fundraiser',
    taskTitle: '',
    taskDescription: '',
    taskCategory: 'BAKING_PRODUCTION',
    priorityLevel: 'MEDIUM',
    allocatedBudgetCap: 500,
    targetCompletionDate: new Date(Date.now() + 7 * 86400000).toISOString()
  });
  const [errorMessage, setErrorMessage] = useState('');
  const { runWithProcessingLock } = useSystemProcessing();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await runWithProcessingLock(async () => {
        const response = await apiNetworkClient.post('/activities', taskData);
        if (response.data?.successIndicator) {
          onTaskCreated(response.data.taskRecord);
          onClose();
        }
      }, 'Adding volunteer task to backlog...');
    } catch (err) {
      setErrorMessage(err.response?.data?.errorSummaryMessage || 'Failed to create volunteer task.');
    }
  };

  return (
    <div
      data-component="TaskCreationModal"
      data-purpose="add-volunteer-task"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-odoo-primary" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              New Volunteer Task (Bake Sale Fundraiser)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Task Title</label>
            <input
              type="text"
              required
              value={taskData.taskTitle}
              onChange={(e) => setTaskData({ ...taskData, taskTitle: e.target.value })}
              placeholder="e.g. Bake 50 Blueberry Scones"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Description / Plan</label>
            <textarea
              rows="2"
              value={taskData.taskDescription}
              onChange={(e) => setTaskData({ ...taskData, taskDescription: e.target.value })}
              placeholder="Recipe details, packaging instructions, shift hours..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Category</label>
              <select
                value={taskData.taskCategory}
                onChange={(e) => setTaskData({ ...taskData, taskCategory: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="BAKING_PRODUCTION">Baking & Kitchen</option>
                <option value="SUPPLIES_LOGISTICS">Supplies & Logistics</option>
                <option value="TABLE_MANAGEMENT">Table Shifts</option>
                <option value="MARKETING_OUTREACH">Signage & Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Priority</label>
              <select
                value={taskData.priorityLevel}
                onChange={(e) => setTaskData({ ...taskData, priorityLevel: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Budget Allocation (₹)</label>
              <input
                type="number"
                min="0"
                value={taskData.allocatedBudgetCap}
                onChange={(e) => setTaskData({ ...taskData, allocatedBudgetCap: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Target Due Date</label>
              <input
                type="date"
                required
                onChange={(e) => setTaskData({ ...taskData, targetCompletionDate: new Date(e.target.value).toISOString() })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:border-odoo-primary focus:outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary-action">
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              Add to Kanban Backlog
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

