/**
 * @FILE: BroadcastsView.jsx
 * @RESPONSIBILITY: Official club announcements feed featuring audience tier filters, read receipts, and real-time Socket.IO alerts.
 * @DEPENDENCIES: react, lucide-react, socket.io-client, apiNetworkClient.js, ControlPanelHeader.jsx, SystemProcessingContext.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Broadcast publication and real-time socket listeners.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Radio, Plus, CheckCheck, Bell, AlertTriangle, Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const BroadcastsView = () => {
  const [bulletins, setBulletins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBulletin, setNewBulletin] = useState({
    bulletinTitle: '',
    bulletinContent: '',
    targetAudienceTier: 'ALL_MEMBERS',
    bulletinCategory: 'GENERAL_ANNOUNCEMENT',
    isUrgentHighPriority: false
  });
  const [liveAlert, setLiveAlert] = useState(null);
  const { runWithProcessingLock } = useSystemProcessing();
  const { currentUser, isAdminOrOperations } = useAuthentication();

  const loadBulletins = async () => {
    try {
      const response = await apiNetworkClient.get('/broadcasts');
      if (response.data?.successIndicator) {
        setBulletins(response.data.bulletinsList);
      }
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    }
  };

  useEffect(() => {
    loadBulletins();
    const socket = io('/', { path: '/socket.io', withCredentials: true });
    socket.on('BROADCAST_PUBLISHED', (data) => {
      setLiveAlert(`🔔 Live Bulletin: ${data.bulletinTitle} (${data.targetAudienceTier})`);
      loadBulletins();
    });
    return () => socket.disconnect();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      await runWithProcessingLock(async () => {
        await apiNetworkClient.post('/broadcasts', newBulletin);
        setIsModalOpen(false);
        await loadBulletins();
      }, 'Broadcasting announcement to club...');
    } catch (err) {
      console.error('Failed to broadcast:', err);
    }
  };

  const handleAcknowledge = async (broadcastId) => {
    try {
      await apiNetworkClient.post(`/broadcasts/${broadcastId}/ack`, {});
      await loadBulletins();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Bulletins', path: '/broadcasts' },
    { label: 'Official Announcements' }
  ];

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {isAdminOrOperations() && (
        <button onClick={() => setIsModalOpen(true)} className="btn-primary-action flex items-center space-x-1">
          <Plus className="w-3.5 h-3.5" />
          <span>New Broadcast</span>
        </button>
      )}
    </div>
  );

  return (
    <div data-component="BroadcastsView" data-purpose="announcements-feed" className="flex flex-col h-full bg-slate-50">
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      {liveAlert && (
        <div className="px-4 py-2 bg-odoo-accent text-white font-bold text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{liveAlert}</span>
          </div>
          <button onClick={() => setLiveAlert(null)} className="text-2xs text-white/80 hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {bulletins.map((bulletin) => (
            <div key={bulletin._id} className="bg-white border border-odoo-border rounded-lg shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs font-mono font-bold text-odoo-primary bg-odoo-primary/10 px-2 py-0.5 rounded border border-odoo-primary/20">
                    {bulletin.broadcastTrackingCode}
                  </span>
                  <span className="px-1.5 py-0.2 text-2xs font-bold uppercase rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {bulletin.targetAudienceTier}
                  </span>
                  {bulletin.isUrgentHighPriority && (
                    <span className="inline-flex items-center text-2xs font-bold uppercase rounded bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2">
                      <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                      Urgent
                    </span>
                  )}
                </div>
                <span className="text-2xs text-slate-400">{new Date(bulletin.createdAt).toLocaleString()}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{bulletin.bulletinTitle}</h3>
                <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{bulletin.bulletinContent}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                <span>Published by: <strong className="text-slate-700">{bulletin.senderUserId?.fullName || 'Officer'}</strong></span>
                <button
                  onClick={() => handleAcknowledge(bulletin._id)}
                  className="flex items-center space-x-1 text-odoo-primary hover:text-odoo-primaryHover font-bold"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge Read</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg p-5 max-w-lg w-full shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Compose Official Club Broadcast</h3>
            <form onSubmit={handlePublish} className="space-y-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newBulletin.bulletinTitle}
                  onChange={(e) => setNewBulletin({ ...newBulletin, bulletinTitle: e.target.value })}
                  placeholder="e.g. Mandatory Assembly for Spring Gala"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Audience Scope</label>
                <select
                  value={newBulletin.targetAudienceTier}
                  onChange={(e) => setNewBulletin({ ...newBulletin, targetAudienceTier: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="ALL_MEMBERS">All Active Members</option>
                  <option value="EXECUTIVES_ONLY">Executive Board Only</option>
                  <option value="PUBLIC">Public & Campus Community</option>
                </select>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 uppercase mb-1">Content</label>
                <textarea
                  rows="4"
                  required
                  value={newBulletin.bulletinContent}
                  onChange={(e) => setNewBulletin({ ...newBulletin, bulletinContent: e.target.value })}
                  placeholder="Official announcement body..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newBulletin.isUrgentHighPriority}
                  onChange={(e) => setNewBulletin({ ...newBulletin, isUrgentHighPriority: e.target.checked })}
                  className="w-3.5 h-3.5 text-rose-600"
                />
                <span className="text-2xs font-bold text-rose-700">Flag as High Priority / Urgent Alert</span>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary-action">Cancel</button>
                <button type="submit" className="btn-primary-action flex items-center space-x-1">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

