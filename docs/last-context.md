# AAS Deployments PoC — Session Context

**Date:** 2026-03-26
**Last commit:** `2d06860` on `master`
**Repo:** `C:\dev\TEST-APPS\aas-deployments-poc` / `github.com/NicL9923/aas-deployments-poc`

## What we did this session

Consolidated from safe/bold variants to bold-only, then iterated heavily on the Deployments page UI:

### Major changes
- **Removed safe variant** entirely (context, components, types, toggle in TopBar)
- **Source card** — connected state shows repo/branch/runtime + Deploy (confirm dialog) + Disconnect (red solid button); disconnected state shows "No deployment source" with Choose Source button
- **Slots overview card** — traffic distribution bar chart (brand blue for prod, purple for staging), horizontal legend with status dots. Mock data: 75%/25%
- **Latest deployment hero card** — clicks open detail dialog (shared with recent deployments), no more inline log expansion or progress bar
- **Sidecar containers card** — proper `<table>`, Add button (primary), edit dialog on name click, logs dialog, delete button per row
- **Recent deployments** — dense `<table>` with Status/Deployment/Time/Duration/Chevron columns. "by author" inline with commit message. Click opens detail dialog with phases + two-level log viewer
- **Two-level deployment logs** — `DeploymentLogTable` component: timestamped activity table (Time/Activity/Log), "Show logs" expands `StreamingLogViewer` inline per row. Falls back to raw `StreamingLogViewer` for entries without structured `deploymentLogs`
- **FTPS credentials dialog** — full app-scope/user-scope sections, copy buttons, reset buttons, download publish profile button, warning banner when disabled
- **Activity log dialog** — timestamped operation table (Operation/Status/Time/Timestamp/Subscription/Initiated by)
- **Manage slots → MenuButton** with "Add slot" (opens dialog with name + clone-from dropdown) and "Adjust traffic" (traffic distribution dialog with live bar chart + spin buttons)
- **Swap dialog** — deployment info (commit + StatusBadge) under source/target dropdowns, ellipsis on config change table cells
- **Slot selector** moved from toolbar to LeftNav via `SlotContext`
- **Full-width layout**, matched card heights across rows
- **StatusBadge** — removed spinner from InProgress (phase pills suffice)
- **StreamingLogViewer** — fixed 300px height, removed Follow toggle

### File map
- `src/App.tsx` — FluentProvider + SlotProvider + BrowserRouter + PortalShell
- `src/context/SlotContext.tsx` — selectedSlot state shared between LeftNav and Deployments
- `src/components/portal-chrome/LeftNav.tsx` — slot dropdown above search
- `src/components/portal-chrome/TopBar.tsx` — cleaned (no more variant switcher)
- `src/components/shared/DeploymentLogTable.tsx` — two-level log viewer component
- `src/components/shared/StreamingLogViewer.tsx` — fixed height, no follow toggle
- `src/components/shared/StatusBadge.tsx` — no spinner
- `src/components/shared/SwapDialog.tsx` — deploy info + StatusBadge under dropdowns, ellipsis cells
- `src/experiences/bold/Deployments.tsx` — THE big file (~1500 lines), all the dialogs and sections
- `src/experiences/bold/DeploymentSlots.tsx` — slot cards (not currently routed to, but exists)
- `src/mock-data/index.ts` — all mock data including deploymentLogs, sidecarContainers, activityLogs
- `src/types.ts` — DeploymentLogEntry, DeploymentEntry.deploymentLogs field

### Known issues
- SWA deployment fails with "too many static files" — likely needs workflow config for build output
- `Deployments.tsx` is ~1500 lines and could benefit from extraction (dialogs → separate components)
- The `DeploymentSlots.tsx` page exists but isn't routed to — could be removed or integrated

### Potential next steps
- Extract dialogs from Deployments.tsx into separate components
- Add routing for deployment slots page or integrate into main view
- Fix SWA deployment workflow
- Add more mock deployment log entries
- Consider responsive/mobile layout
- Dark mode testing
