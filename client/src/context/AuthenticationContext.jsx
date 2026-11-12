/**
 * @FILE: AuthenticationContext.jsx
 * @RESPONSIBILITY: React context managing user credentials, session hydration via /auth/me, role tiers, and authentication state.
 * @DEPENDENCIES: react, apiNetworkClient.js.
 * @MODIFICATION_HOTSPOT: hydrateUserSession and loginUserWithCredentials.
 * @AUTHOR: Garima Mittal
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiNetworkClient } from '../services/apiNetworkClient.js';

const AuthenticationContext = createContext(null);

export const AuthenticationProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthResolving, setIsAuthResolving] = useState(true);

  const hydrateUserSession = async () => {
    try {
      const response = await apiNetworkClient.get('/auth/me');
      if (response.data?.successIndicator) {
        setCurrentUser(response.data.userProfile);
      }
    } catch (error) {
      setCurrentUser(null);
    } finally {
      setIsAuthResolving(false);
    }
  };

  useEffect(() => {
    hydrateUserSession();
  }, []);

  const loginUserWithCredentials = async (emailAddress, passwordCredential) => {
    const response = await apiNetworkClient.post('/auth/login', {
      emailAddress,
      passwordCredential
    });
    if (response.data?.successIndicator) {
      await hydrateUserSession();
    }
    return response.data;
  };

  const logoutCurrentSession = async () => {
    try {
      await apiNetworkClient.post('/auth/logout');
    } finally {
      setCurrentUser(null);
    }
  };

  const isRole = (targetRole) => {
    return currentUser?.userRoleTier === targetRole;
  };

  const isAdminOrOperations = () => {
    return currentUser?.userRoleTier === 'ADMIN' || currentUser?.userRoleTier === 'OPERATIONS';
  };

  const contextValue = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isAuthResolving,
    loginUserWithCredentials,
    logoutCurrentSession,
    hydrateUserSession,
    isRole,
    isAdminOrOperations
  };

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => {
  const authContext = useContext(AuthenticationContext);
  if (!authContext) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider');
  }
  return authContext;
};

