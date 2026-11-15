/**
 * @FILE: EventListView.jsx
 * @RESPONSIBILITY: Dense Odoo event dashboard with personal ticket wallet, pending approval verification queue, and duplicate purchase locks.
 * @DEPENDENCIES: react, lucide-react, react-router-dom, apiNetworkClient.js, ControlPanelHeader.jsx, TicketPurchaseModal.jsx, AuthenticationContext.jsx, SystemProcessingContext.jsx.
 * @MODIFICATION_HOTSPOT: Ticket wallet rendering, approval queue, and purchase modal triggers.
 * @AUTHOR: Garima Mittal
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  CheckCircle,
  Clock,
  ShieldCheck,
  QrCode,
  ExternalLink,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiNetworkClient } from '../../services/apiNetworkClient.js';
import { ControlPanelHeader } from '../../components/common/ControlPanelHeader.jsx';
import { TicketPurchaseModal } from './TicketPurchaseModal.jsx';
import { useAuthentication } from '../../context/AuthenticationContext.jsx';
import { useSystemProcessing } from '../../context/SystemProcessingContext.jsx';

export const EventListView = () => {
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedEventForPurchase, setSelectedEventForPurchase] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAdminOrOperations } = useAuthentication();
  const { runWithProcessingLock } = useSystemProcessing();

  const loadAllEventsData = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, myTicketsRes] = await Promise.all([
        apiNetworkClient.get('/events'),
        apiNetworkClient.get('/events/my-tickets').catch(() => ({ data: { userTickets: [] } }))
      ]);
      if (eventsRes.data?.successIndicator) setEvents(eventsRes.data.eventsList);
      if (myTicketsRes.data?.successIndicator) setMyTickets(myTicketsRes.data.userTickets);

      if (isAdminOrOperations()) {
        const approvalsRes = await apiNetworkClient.get('/events/tickets/pending-approvals').catch(() => ({ data: { pendingTickets: [] } }));
        if (approvalsRes.data?.successIndicator) setPendingApprovals(approvalsRes.data.pendingTickets);
      }
    } catch (err) {
      console.error('Failed to load events data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllEventsData();
  }, []);

  const handleApproveTicket = async (ticketId) => {
    await runWithProcessingLock(async () => {
      await apiNetworkClient.post(`/events/tickets/${ticketId}/approve`);
      await loadAllEventsData();
    }, 'Approving ticket & generating digital pass...');
  };

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

  const renderTicketWallet = () => {
    if (!myTickets || myTickets.length === 0) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-odoo-primary" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              My Tickets & Passes Wallet
            </h2>
          </div>
          <span className="text-2xs font-semibold text-slate-500">{myTickets.length} Pass(es)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {myTickets.map((t) => {
            const isConfirmed = t.approvalState === 'CONFIRMED' || (!t.approvalState && t.admissionState === 'ISSUED');
            return (
              <div
                key={t._id}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isConfirmed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-bold text-odoo-primary">
                      {t.ticketTrackingCode}
                    </span>
                    {isConfirmed ? (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-3xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> CONFIRMED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-3xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-2.5 h-2.5 mr-0.5" /> PENDING VERIFICATION
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {t.associatedEventId?.eventTitle || 'Campus Gala'}
                    </h3>
                    <div className="text-2xs text-slate-500">{t.tierName} Tier • ₹{t.unitPricePaid}</div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  {isConfirmed && t.qrDataUrl ? (
                    <div className="flex items-center space-x-2">
                      <img src={t.qrDataUrl} alt="Ticket QR" className="w-12 h-12 rounded border bg-white p-0.5" />
                      <div className="text-3xs text-slate-600">
                        <div>Ready for gate scan</div>
                        <div className="font-bold text-emerald-700">{t.admissionState}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xs text-amber-800 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>QR will unlock once officer verifies proof.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPendingApprovalsQueue = () => {
    if (!isAdminOrOperations() || pendingApprovals.length === 0) return null;
    return (
      <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
              Pending Ticket Approvals Queue ({pendingApprovals.length})
            </h2>
          </div>
          <span className="text-3xs text-amber-800">Review payment proofs before activating passes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-2xs">
            <thead>
              <tr className="border-b border-amber-200 text-amber-900 font-bold uppercase">
                <th className="py-1.5 px-2">Ticket Code</th>
                <th className="py-1.5 px-2">Event</th>
                <th className="py-1.5 px-2">Student</th>
                <th className="py-1.5 px-2">Tier & Amount</th>
                <th className="py-1.5 px-2">Payment Mode</th>
                <th className="py-1.5 px-2">Proof / Ref</th>
                <th className="py-1.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {pendingApprovals.map((t) => (
                <tr key={t._id} className="hover:bg-amber-100/50 transition-colors">
                  <td className="py-1.5 px-2 font-mono font-bold text-odoo-primary">{t.ticketTrackingCode}</td>
                  <td className="py-1.5 px-2 font-semibold text-slate-800">{t.associatedEventId?.eventTitle}</td>
                  <td className="py-1.5 px-2 text-slate-700">
                    <div>{t.purchaserUserId?.fullName}</div>
                    <div className="text-3xs text-slate-500 font-mono">{t.purchaserUserId?.studentIdentificationNumber}</div>
                  </td>
                  <td className="py-1.5 px-2 font-bold text-emerald-800">{t.tierName} (₹{t.unitPricePaid})</td>
                  <td className="py-1.5 px-2">
                    <span className="px-1.5 py-0.5 rounded text-3xs font-semibold bg-white border border-amber-200 text-slate-800">
                      {t.paymentDetails?.paymentMode || 'ONLINE'}
                    </span>
                  </td>
                  <td className="py-1.5 px-2">
                    {t.paymentDetails?.paymentScreenshotUrl ? (
                      <a
                        href={t.paymentDetails.paymentScreenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center space-x-0.5"
                      >
                        <span className="font-mono">{t.paymentDetails.transactionId || 'View Proof'}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono">{t.paymentDetails?.transactionId || 'Cash Admission'}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      onClick={() => handleApproveTicket(t._id)}
                      className="px-2 py-1 text-3xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                    >
                      Approve Ticket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      data-component="EventListView"
      data-purpose="events-dashboard"
      className="flex flex-col h-full bg-slate-50"
    >
      <ControlPanelHeader breadcrumbsArray={breadcrumbs} actionButtons={actionButtons} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {renderPendingApprovalsQueue()}
          {renderTicketWallet()}

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
              {events.map((event) => {
                const userTicketForEvent = myTickets.find(
                  (t) => (t.associatedEventId?._id || t.associatedEventId) === event._id &&
                    t.admissionState !== 'CANCELLED'
                );
                return (
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
                                  <span className="text-purple-700 font-bold bg-purple-100/60 px-1 rounded text-3xs">
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
                      <span className="text-2xs text-slate-500">
                        {userTicketForEvent ? 'Pass generated in Wallet' : 'Immediate E-Ticket Generation with QR'}
                      </span>
                      {userTicketForEvent ? (
                        <span className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded inline-flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Booked (In Wallet)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenPurchase(event)}
                          className="btn-primary-action flex items-center space-x-1"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Get Tickets</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TicketPurchaseModal
        isOpen={isPurchaseModalOpen}
        event={selectedEventForPurchase}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchaseSuccess={() => loadAllEventsData()}
      />
    </div>
  );
};
