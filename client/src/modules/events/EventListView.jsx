/**
 * @FILE: EventListView.jsx
 * @RESPONSIBILITY: Dense Odoo event dashboard cards displaying live remaining seat quotas, date badges, and multi-tier pricing matrices.
 * @DEPENDENCIES: react, lucide-react, react-router-dom, apiNetworkClient.js, ControlPanelHeader.jsx, TicketPurchaseModal.jsx, AuthenticationContext.jsx.
 * @MODIFICATION_HOTSPOT: Event listing grid and ticket purchase triggers.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Ticket, CheckCircle, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { TicketPurchaseModal } from './TicketPurchaseModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';

export const EventListView = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventForPurchase, setSelectedEventForPurchase] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations } = useAuthentication();

  const loadEventsData = async () => {
    setIsLoading(true);
    try {
      const response = await apiNetworkClient.get('/events');
      if (response.data?.successIndicator) {
        setEvents(response.data.eventsList);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();
  }, []);

  const handleOpenPurchase = (eventObj) => {
    setSelectedEventForPurchase(eventObj);
    setIsPurchaseModalOpen(true);
  };

  const breadcrumbs = [
    { label: 'ClubSphere', path: '/' },
    { label: 'Events', path: '/events' },
    { label: 'Campus Schedule' }
  ];

  const actionButtons = (
    <div className="flex items-center space-x-2">
      {isAdminOrOperations() && (
        <Link to="/events/scanner" className="btn-secondary-action flex items-center space-x-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>Door Scanner Terminal</span>
        </Link>
      )}
    </div>
  );

  return (
    <div
      data-component="EventListView"
      data-purpose="events-dashboard"
      className="flex flex-col h-full bg-slate-50"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Skyline Scheduled Events & Galas
            </h1>
            <span className="text-2xs font-semibold text-slate-500">
              Showing {events.length} active events
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading campus events...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
              No campus events scheduled at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-white border border-odoo-border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="text-2xs font-mono font-bold text-odoo-primary bg-odoo-primary/10 px-2 py-0.5 rounded border border-odoo-primary/20">
                        {event.eventTrackingCode}
                      </span>
                      <span className="px-2 py-0.5 text-2xs font-bold uppercase rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {event.lifecycleState}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-slate-900">{event.eventTitle}</h2>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{event.eventDescription}</p>
                    </div>

                    <div className="space-y-1.5 text-2xs text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(event.startDateTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.venueLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Max Capacity: {event.maximumCapacityLimit} Seats</span>
                      </div>
                    </div>

                    {/* Ticket Tiers Matrix */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-2xs font-bold text-slate-400 uppercase block mb-1.5">
                        Ticket Pricing Brackets
                      </span>
                      <div className="space-y-1.5">
                        {event.ticketTiers?.map((tier) => (
                          <div
                            key={tier.tierIdentifier}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-2xs"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-800">{tier.tierName}</span>
                              {tier.isMemberExclusive && (
                                <span className="text-purple-700 font-bold bg-purple-100/60 px-1 rounded">
                                  Member
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">₹{tier.priceAmount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-2xs text-slate-500">Immediate E-Ticket Generation with QR</span>
                    <button
                      onClick={() => handleOpenPurchase(event)}
                      className="btn-primary-action flex items-center space-x-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Get Tickets</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TicketPurchaseModal
        isOpen={isPurchaseModalOpen}
        event={selectedEventForPurchase}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchaseSuccess={() => loadEventsData()}
      />
    </div>
  );
};

