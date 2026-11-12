/**
 * @file SystemLogsView.jsx
 * @module diagnostics
 * @description Admin-only monospace terminal HUD streaming real-time backend
 *              console logs, Node.js memory telemetry, and MongoDB connection health.
 * @author Garima Mittal
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Database, Cpu, RefreshCw, Terminal } from 'lucide-react';
import apiNetworkClient from '../../services/apiNetworkClient.js';

/* ─── Constants ─────────────────────────────────────────────── */
const POLL_INTERVAL_MS  = 3000;
const MAX_LOG_LINES     = 200;
const LEVEL_COLORS      = { INFO: 'text-green-400', WARN: 'text-yellow-400', ERROR: 'text-red-400', DEBUG: 'text-blue-400' };

/* ─── Sub-Component: HealthMetricBadge ──────────────────────── */
function HealthMetricBadge({ icon: Icon, label, value, colorClass }) {
  return (
    <div data-component="HealthMetricBadge" data-purpose="telemetry-pill"
         className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-3 py-2">
      <Icon size={14} className={colorClass} />
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-mono font-semibold ${colorClass}`}>{value}</span>
    </div>
  );
}

/* ─── Sub-Component: LogLine ────────────────────────────────── */
function LogLine({ entry }) {
  const color = LEVEL_COLORS[entry.level] ?? 'text-gray-300';
  return (
    <div data-component="LogLine" className="flex gap-3 text-xs font-mono leading-5 hover:bg-gray-800/50">
      <span className="text-gray-600 shrink-0 select-none">{entry.ts}</span>
      <span className={`w-12 shrink-0 font-semibold ${color}`}>{entry.level}</span>
      <span className="text-gray-200 break-all">{entry.message}</span>
    </div>
  );
}

/* ─── Sub-Component: ConnectionStatusBadge ──────────────────── */
function ConnectionStatusBadge({ status }) {
  const isConnected = status === 'connected';
  return (
    <div data-component="ConnectionStatusBadge" data-purpose="mongodb-status"
         className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border
           ${isConnected ? 'bg-green-900/40 border-green-700 text-green-400' : 'bg-red-900/40 border-red-700 text-red-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
      MongoDB: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}

/* ─── Sub-Component: LogTerminalPanel ───────────────────────── */
function LogTerminalPanel({ logs, autoScroll, bottomRef }) {
  return (
    <div data-component="LogTerminalPanel" data-purpose="log-output"
         className="flex-1 overflow-y-auto bg-gray-950 border border-gray-700 rounded p-3 space-y-0.5 font-mono text-xs">
      {logs.length === 0 && <p className="text-gray-600 italic">Waiting for log stream…</p>}
      {logs.map((entry, idx) => <LogLine key={idx} entry={entry} />)}
      {autoScroll && <div ref={bottomRef} />}
    </div>
  );
}

/* ─── Sub-Component: TelemetryHeader ────────────────────────── */
function TelemetryHeader({ health, dbStatus, autoScroll, setAutoScroll, lastPolled }) {
  const heapUsed  = health?.memory?.heapUsed  ? `${Math.round(health.memory.heapUsed  / 1024 / 1024)} MB` : '—';
  const heapTotal = health?.memory?.heapTotal ? `${Math.round(health.memory.heapTotal / 1024 / 1024)} MB` : '—';
  const uptime    = health?.uptime ? `${Math.round(health.uptime)}s` : '—';

  return (
    <div data-component="TelemetryHeader" data-purpose="system-metrics"
         className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-700">
      <HealthMetricBadge icon={Cpu}      label="Heap Used"  value={heapUsed}  colorClass="text-purple-400" />
      <HealthMetricBadge icon={Cpu}      label="Heap Total" value={heapTotal} colorClass="text-purple-300" />
      <HealthMetricBadge icon={Activity} label="Uptime"     value={uptime}    colorClass="text-teal-400"   />
      <ConnectionStatusBadge status={dbStatus} />
      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none">
          <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)}
                 className="accent-purple-500" />
          Auto-scroll
        </label>
        {lastPolled && <span className="text-2xs text-gray-600">Last: {lastPolled}</span>}
      </div>
    </div>
  );
}

/* ─── Hook: useSystemTelemetry ──────────────────────────────── */
function useSystemTelemetry() {
  const [logs,      setLogs]      = useState([]);
  const [health,    setHealth]    = useState(null);
  const [dbStatus,  setDbStatus]  = useState('unknown');
  const [lastPolled, setLastPolled] = useState(null);

  const appendLogs = useCallback((incoming) => {
    setLogs(prev => [...prev, ...incoming].slice(-MAX_LOG_LINES));
  }, []);

  const pollOnce = useCallback(async () => {
    try {
      const [healthRes, logsRes] = await Promise.all([
        apiNetworkClient.get('/diagnostics/health'),
        apiNetworkClient.get('/diagnostics/logs'),
      ]);
      setHealth(healthRes.data?.data ?? null);
      setDbStatus(healthRes.data?.data?.database ?? 'unknown');
      const incoming = (logsRes.data?.data ?? []).map(l => ({
        ts:      l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '--:--:--',
        level:   (l.level ?? 'INFO').toUpperCase(),
        message: l.message ?? '',
      }));
      appendLogs(incoming);
      setLastPolled(new Date().toLocaleTimeString());
    } catch (err) {
      appendLogs([{ ts: new Date().toLocaleTimeString(), level: 'ERROR', message: `Poll failed: ${err.message}` }]);
    }
  }, [appendLogs]);

  useEffect(() => {
    pollOnce();
    const timer = setInterval(pollOnce, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pollOnce]);

  return { logs, health, dbStatus, lastPolled, clearLogs: () => setLogs([]) };
}

/* ─── Main View ─────────────────────────────────────────────── */
export default function SystemLogsView() {
  const { logs, health, dbStatus, lastPolled, clearLogs } = useSystemTelemetry();
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  return (
    <section data-component="SystemLogsView" data-purpose="admin-telemetry-terminal"
             className="h-full flex flex-col gap-4 p-6 bg-gray-900 text-gray-100">

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Terminal size={20} className="text-purple-400" />
        <h1 className="text-lg font-semibold tracking-tight">System Diagnostics</h1>
        <span className="ml-auto text-2xs text-gray-500">Polling every {POLL_INTERVAL_MS / 1000}s</span>
        <button onClick={clearLogs}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-2 py-1">
          <RefreshCw size={12} /> Clear
        </button>
      </div>

      {/* Metrics Bar */}
      <TelemetryHeader health={health} dbStatus={dbStatus}
                       autoScroll={autoScroll} setAutoScroll={setAutoScroll}
                       lastPolled={lastPolled} />

      {/* Log Terminal */}
      <LogTerminalPanel logs={logs} autoScroll={autoScroll} bottomRef={bottomRef} />
    </section>
  );
}

