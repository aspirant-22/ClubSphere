/**
 * @FILE: ProgressWorkflowRibbon.jsx
 * @RESPONSIBILITY: Top-right glowing FSM workflow ribbon tracking Draft ➔ Waiting ➔ Ready ➔ Done transitions.
 * @DEPENDENCIES: react, lucide-react.
 * @MODIFICATION_HOTSPOT: DEFAULT_WORKFLOW_STAGES and glowing status styles.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Check } from 'lucide-react';

const DEFAULT_WORKFLOW_STAGES = ['DRAFT', 'WAITING', 'READY', 'DONE'];

export const ProgressWorkflowRibbon = ({
  currentStage = 'DRAFT',
  workflowStages = DEFAULT_WORKFLOW_STAGES
}) => {
  const normalizedCurrentStage = currentStage ? currentStage.toUpperCase() : 'DRAFT';
  const currentStageIndex = workflowStages.indexOf(normalizedCurrentStage);

  return (
    <div
      data-component="ProgressWorkflowRibbon"
      data-purpose="fsm-status-ribbon"
      className="inline-flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200"
    >
      {workflowStages.map((stageName, index) => {
        const isCurrentActive = stageName === normalizedCurrentStage;
        const isPastCompleted = currentStageIndex > -1 && index < currentStageIndex;

        let badgeStyles = 'text-slate-400 bg-transparent';
        if (isCurrentActive) {
          badgeStyles = 'bg-white text-odoo-primary font-bold shadow-xs border border-slate-200 ring-1 ring-odoo-primary/30';
        } else if (isPastCompleted) {
          badgeStyles = 'text-emerald-700 bg-emerald-50/50';
        }

        return (
          <div
            key={stageName}
            className={`flex items-center px-2 py-0.5 text-2xs uppercase tracking-wider rounded-xs transition-all ${badgeStyles}`}
          >
            {isPastCompleted && <Check className="w-2.5 h-2.5 mr-1 text-emerald-600" />}
            <span>{stageName}</span>
          </div>
        );
      })}
    </div>
  );
};
