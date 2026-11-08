# BUSINESS REQUIREMENTS DOCUMENT (BRD)
## RSR Factory360: Enterprise Manufacturing Execution & Production Management Platform

**Document Reference:** RSR-MES-BRD-2026-V1  
**Project Owner / Development Lead:** Anil  
**Organization:** RSR Technologies  
**Target Manufacturing Zones:** Jigani & Bommasandra Industrial Areas, Bengaluru, Karnataka, India  
**Target Industries:** Precision Machining, Automotive Component Assembly, Plastics Injection Molding, Food & Beverage Processing, Packaging, Electronics Assembly (EMS).

---

### 1. Executive Summary & Business Need
Small-to-medium and enterprise manufacturing facilities located in Bengaluru's primary industrial belts (Jigani and Bommasandra) face operational friction due to disconnected systems:
- Paper travelers, manual production log sheets, and whiteboard schedules leading to production reporting delays of 8 to 24 hours.
- Disconnected quality recording causing delayed non-conformance detection and unnecessary scrap batches.
- Unplanned machine micro-stops and unrecorded downtime, distorting true plant efficiency and Overall Equipment Effectiveness (OEE).
- Inability to achieve rigorous forward and backward traceability required by ISO 9001 and IATF 16949 audits.

**RSR Factory360** bridges shop-floor operations with executive management by delivering a real-time, multi-plant Manufacturing Execution System (MES Lite to Full MES).

---

### 2. Business Objectives & Success Metrics
1. **Real-Time Visibility:** Reduce production status lag from 1 shift (8 hours) to < 5 seconds via real-time WebSocket telemetry and operator booking.
2. **OEE Optimization:** Establish true World-Class OEE tracking (Availability × Performance × Quality) with automated deduction of planned breaks and real-time downtime categorization. Target: +12% OEE improvement within 6 months.
3. **Zero Paper Travelers:** Replace physical traveler cards with Digital Travelers and QR/Barcode-based tracking across all routing stages.
4. **Scrap & Non-Conformance Reduction:** Auto-generate Non-Conformance Reports (NCR) and enforce automated Quality Holds on suspicious work orders, machines, and lots.
5. **Multi-Plant Scalability:** Native architectural support for multi-site operations (e.g., Plant 1 in Jigani, Plant 2 in Bommasandra, future expansions in Peenya/Bidadi).

---

### 3. Stakeholder Ecosystem & User Personas

| Persona / Role | Key Responsibilities | Primary Needs in Factory360 |
| :--- | :--- | :--- |
| **System Administrator** | User security, plant hierarchy, system integration, audit trails | Role-based access control, security log review, data backup & DR |
| **Plant Manager** | Factory throughput, shift performance, OEE metrics, capex utilization | High-level overview dashboards, multi-line comparisons, trend exports |
| **Production Manager** | Work order lifecycle, Gantt scheduling, backlog management | Drag-and-drop planning, capacity conflict warnings, target vs. actual |
| **Shift Supervisor** | Line supervision, operator assignments, Andon escalation response | Real-time line status, downtime approval, shift handover sign-offs |
| **Machine Operator** | Work execution, piece counting, scrap logging, micro-stop reporting | Large tablet touch targets, barcode scanner inputs, offline resilience |
| **Quality Inspector** | First-off validation, in-process SPC, final inspection, NCR & Holds | Digital inspection checklists, instant containment holds, NCR logs |
| **Maintenance Engineer** | Machine uptime, preventive maintenance (PM), breakdown work orders | MTBF/MTTR tracking, spare part logging, service record sign-offs |
| **Warehouse Manager** | Raw material receipts, WIP inventory, BOM consumption, stock ledger | FIFO lot tracking, bin locations, automated stock deduction |

---

### 4. High-Level Functional Scope (21 Core Modules)

```
+-----------------------------------------------------------------------------------+
|                              RSR FACTORY360 MES                                   |
+-----------------------------------------------------------------------------------+
| [01] Overview Dashboard       [08] Downtime & Andon       [15] Work Instructions |
| [02] Production Planning      [09] Quality Management     [16] Reports & Exports |
| [03] Work Orders              [10] OEE & Analytics        [17] Notifications     |
| [04] Production Execution     [11] Products & BOM         [18] User Management   |
| [05] Production Lines         [12] Materials & Inventory  [19] Audit Logs        |
| [06] Machines & Equipment     [13] Barcode Traceability   [20] Integrations      |
| [07] Shift Management         [14] Maintenance Mgmt       [21] System Settings   |
+-----------------------------------------------------------------------------------+
```

---

### 5. Regulatory Compliance & Industry Standards
- **ISO 9001:2015:** Clause 8.5.1 (Control of production), 8.5.2 (Identification and traceability).
- **IATF 16949:2016:** Automotive requirements for error-proofing, first-piece inspection, and total productive maintenance (TPM).
- **FDA 21 CFR Part 11 Compliance Principles:** Immutable audit trails for all critical state changes, operator signatures, and user access restrictions.

---

### 6. Assumptions & Dependencies
- Hardware on shop floor consists of modern tablets (iOS/Android/Windows touch devices) and desktop workstations with standard web browsers (Chrome/Edge/Firefox).
- Industrial machine connectivity leverages OPC UA / MQTT simulation adapters with configurable hardware bridge readiness.
- Production lines support 2-shift or 3-shift operational calendars with scheduled tea and lunch breaks.
