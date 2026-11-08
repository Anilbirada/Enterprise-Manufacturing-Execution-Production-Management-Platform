# UI / UX SCREEN SPECIFICATIONS
## RSR Factory360 MES Design System

---

### 1. Visual Hierarchy & Color Palette
RSR Factory360 implements an industrial design language referencing Siemens Opcenter and high-reliability SCADA/MES interfaces:
- **Base Surfaces:** `industrial-950` (`#070d17`), `industrial-900` (`#0b192c`), `industrial-800` (`#1e3e62`).
- **Interactive Accents:** Restrained Cyan (`#22d3ee` / `#0891b2`) for active selections and highlights.
- **Alarm Red:** `#ef4444` / `#991b1b` for active emergency Andon alarms, machine downtime, and quality rejections.
- **Warning Amber:** `#f59e0b` / `#78350f` for low inventory warnings, overdue orders, and unacknowledged alerts.
- **Healthy Green:** `#10b981` / `#065f46` for running lines, passed inspections, and normal cycle rates.

---

### 2. Dual Experience Profiles

#### Experience A: Desktop-First Enterprise Management
Designed for Plant Managers, Production Planners, and System Administrators:
- **Top Navigation Bar:** Multi-plant switcher (`JGN-PLANT1` Jigani, `BMS-PLANT2` Bommasandra), real-time WebSocket connection indicator, active user badge, and notification bell.
- **Left Sidebar:** Permission-aware navigation menu indexing all 21 manufacturing modules.
- **Dense Data Grids:** Responsive tables with sticky headers, sortable columns, pagination, and Excel/CSV export shortcuts.
- **Gantt Scheduling View:** Visual timeline displaying active lines on the Y-axis and shift hours/days on the X-axis, supporting drag-and-drop job sequencing with capacity conflict warnings.

#### Experience B: Tablet-First Shop-Floor Operator Experience (`/execution`)
Designed for ruggedized shop-floor tablets mounted at machine workstations:
- **Touch-Optimized Targets:** Minimum 48x48px hit areas on all buttons and switches.
- **Prominent Status Banners:** Instant visual recognition of Machine State (`RUNNING` in green, `DOWNTIME` in red, `IDLE` in amber).
- **Barcode & QR Scanner Input:** Auto-focusing text inputs compatible with USB and Bluetooth HID 2D barcode scanners for instant job traveler loading.
- **Single-Tap Scrap Logging:** Preset defect category buttons (e.g., Burr/Flash, Dimensional Error, Tool Wear, Material Flaw) allowing one-touch booking.
- **High-Visibility Andon Alarm:** Giant red emergency button to raise instant line-stop alerts with category selection.
- **Offline Action Indicator:** Visual banner indicating cached bookings when Wi-Fi is lost, with automatic sync status.

---

### 3. Screen Breakdown across Key Modules

| Screen / Page | Primary Layout Elements | Key Actions |
| :--- | :--- | :--- |
| **01. Dashboard** | KPI metric cards (Plant OEE, Target vs. Actual, Line Status summary, Downtime Pareto) | Date range filter, plant switch, line drill-down |
| **02. Planning** | Gantt timeline, unscheduled work order backlog tray, conflict detector | Drag-and-drop order scheduling, shift assignment |
| **03. Work Orders** | Filterable order table, status badges, priority markers, creation modal | Create order, advance state machine, place quality hold |
| **04. Execution** | Digital traveler, piece counter, scrap buttons, cycle time speedometer | Book good/scrap, report downtime, trigger Andon |
| **08. Andon** | Visual Andon board with glowing line tiles and alarm bells | Raise alert, acknowledge, resolve with remarks |
| **09. Quality** | Inspection tabs (Inspections, NCRs, Holds, Plans) | Record First-Off, place immediate containment hold |
| **10. OEE** | Radial gauges for Availability, Performance, Quality, and Overall OEE | Filter by machine, shift, or date; review loss breakdown |
| **13. Traceability** | Interactive forward/backward genealogy tree, QR code generator | Scan batch barcode, view lot component hierarchy |
