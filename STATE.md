/**
 * @FILE: STATE.md
 * @RESPONSIBILITY: Inventory ledger documenting React Context providers, state variables, and custom hooks.
 * @DEPENDENCIES: React 19 Frontend architecture.
 * @MODIFICATION_HOTSPOT: State inventory table.
 * @AUTHOR: Garima Mittal, Principal Enterprise Solutions Architect
 */

# 🧠 ClubSphere: Global Client State Inventory

| Context Provider | Primary State Variables | Purpose & UI Safeguard |
| :--- | :--- | :--- |
| `AuthenticationContext` | `currentUser`, `isAuthenticated`, `userRoleTier`, `isAuthResolving` | Holds authenticated session identity, enforces 4-tier RBAC route gating, provides `loginSession`, `registerAccount`, and `terminateSession`. |
| `SystemProcessingContext` | `isSystemProcessing`, `processingMessage` | Global execution overlay. When `true`, renders a subtle blurred, un-clickable backdrop spinner to block rapid double-clicks and race condition crashes. |
| `SocketNotificationContext` | `socketClient`, `liveNotifications`, `connectionStatus` | Connects to server WebSocket gateway; dispatches real-time broadcast alerts, ticket scan confirmations, and order updates to UI widgets. |
| `NavigationPaletteContext` | `isPaletteVisible`, `paletteQuery`, `navigationalRoutes` | Intercepts `Ctrl + K` / `Cmd + K` keyboard shortcuts to display a high-velocity command search palette modal for instant zero-click navigation. |
| `ThemeContext` | `themeMode`, `activeSidebarSubdomain` | Manages Odoo enterprise interface density, multi-column workspace layout, and navigation breadcrumb hierarchy. |
| `OfflineAlertContext` | `isCloudNodeOffline`, `networkLatencyMs` | Triggers the top-docked latency alert: "⚠️ [ERP System Alert]: Cloud Node latency detected. Transitioning to fallback offline processing state." |
