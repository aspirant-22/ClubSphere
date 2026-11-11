/**
 * @FILE: rbacAuthorization.js
 * @RESPONSIBILITY: 4-tier Role-Based Access Control gate restricting endpoints to authorized user ranks.
 * @DEPENDENCIES: None (Evaluates authenticatedUser role tier).
 * @MODIFICATION_HOTSPOT: ERP_USER_ROLES and authorizeRoleTiers middleware.
 * @AUTHOR: Garima Mittal
 */

export const ERP_USER_ROLES = {
  ADMIN: 'ADMIN',
  OPERATIONS: 'OPERATIONS',
  CUSTOMER: 'CUSTOMER',
  PUBLIC: 'PUBLIC'
};

export const authorizeRoleTiers = (...allowedRoleTiers) => {
  return (incomingHttpRequest, outgoingHttpResponse, nextMiddlewareFunction) => {
    const activeUserProfile = incomingHttpRequest.authenticatedUser;

    if (!activeUserProfile || !activeUserProfile.userRoleTier) {
      console.warn(`[RBAC Rejection]: Unauthenticated access attempt on protected path: ${incomingHttpRequest.originalUrl}`);
      return outgoingHttpResponse.status(401).json({
        successIndicator: false,
        errorCodeIdentifier: 'AUTHENTICATION_REQUIRED',
        errorSummaryMessage: 'Access denied. Valid user authentication profile missing.'
      });
    }

    const assignedUserRole = activeUserProfile.userRoleTier.toUpperCase();
    const isRoleAuthorized = allowedRoleTiers.includes(assignedUserRole);

    if (!isRoleAuthorized) {
      console.warn(`[RBAC Rejection]: User ${activeUserProfile.emailAddress} with role ${assignedUserRole} denied access to ${incomingHttpRequest.originalUrl}`);
      return outgoingHttpResponse.status(403).json({
        successIndicator: false,
        errorCodeIdentifier: 'RBAC_PERMISSION_DENIED',
        errorSummaryMessage: `Access forbidden. Endpoint requires one of roles: [${allowedRoleTiers.join(', ')}].`
      });
    }

    return nextMiddlewareFunction();
  };
};

