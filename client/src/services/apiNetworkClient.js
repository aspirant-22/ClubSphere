/**
 * @FILE: apiNetworkClient.js
 * @RESPONSIBILITY: Axios network instance configured with strict timeouts, HTTP-Only cookie forwarding, and ERP downtime fallback banners.
 * @DEPENDENCIES: axios.
 * @MODIFICATION_HOTSPOT: apiNetworkClient timeout and response error interceptors.
 * @AUTHOR: Garima Mittal
 */

import axios from 'axios';

let globalOfflineStatusListener = null;

export const registerOfflineAlertHandler = (handlerCallback) => {
  globalOfflineStatusListener = handlerCallback;
};

export const apiNetworkClient = axios.create({
  baseURL: '/api/v1',
  timeout: 8000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

apiNetworkClient.interceptors.response.use(
  (successfulResponse) => {
    if (globalOfflineStatusListener) {
      globalOfflineStatusListener({ isOffline: false, message: '' });
    }
    return successfulResponse;
  },
  (networkError) => {
    const isTimeout = networkError.code === 'ECONNABORTED';
    const isServerError = networkError.response && networkError.response.status >= 500;
    const isNetworkDown = !networkError.response;

    if (isTimeout || isServerError || isNetworkDown) {
      const fallbackAlertMessage = '⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state.';
      console.warn(`[Network Gateway Alert]: ${fallbackAlertMessage}`);
      if (globalOfflineStatusListener) {
        globalOfflineStatusListener({ isOffline: true, message: fallbackAlertMessage });
      }
    }

    return Promise.reject(networkError);
  }
);

