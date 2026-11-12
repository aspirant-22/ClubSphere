/**
 * @FILE: ControlPanelHeader.jsx
 * @RESPONSIBILITY: Pinned Odoo control panel header rendering dense breadcrumbs on left and context action buttons on right.
 * @DEPENDENCIES: react, react-router-dom, lucide-react.
 * @MODIFICATION_HOTSPOT: breadcrumbsArray rendering and actionButtons rendering.
 * @AUTHOR: Garima Mittal
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const ControlPanelHeader = ({
  breadcrumbsArray = [],
  actionButtons = null,
  auxiliaryWidget = null
}) => {
  return (
    <div
      data-component="ControlPanelHeader"
      data-purpose="pinned-navigation-and-actions"
      className="control-panel-container"
    >
      <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
        {breadcrumbsArray.map((crumb, index) => {
          const isLastItem = index === breadcrumbsArray.length - 1;
          return (
            <React.Fragment key={crumb.label || index}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {isLastItem || !crumb.path ? (
                <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-xs text-slate-500 hover:text-odoo-primary transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center space-x-2 py-1">
        {auxiliaryWidget}
        {actionButtons}
      </div>
    </div>
  );
};
