# PROJECT CHARTER
## RSR Factory360 MES Deployment & Rollout

**Project Name:** RSR Factory360 Industrial MES Implementation  
**Sponsoring Company:** RSR Technologies  
**Project Lead & Architect:** Anil  
**Geography:** Bengaluru Industrial Corridors (Jigani Industrial Area & Bommasandra Industrial Area)  
**Effective Date:** Q1 2026  

---

### 1. Purpose & Vision
To deploy an industrial-grade Manufacturing Execution System tailored for precision manufacturing, automotive tier-1/tier-2 suppliers, electronics, and plastic molding enterprises in Bengaluru's industrial belt. The system delivers complete digital shop-floor governance, eliminating manual paper tracking, elevating OEE transparency, and guaranteeing strict traceability.

---

### 2. Pilot Manufacturing Plants

#### Plant 1: Jigani Precision Engineering Plant (`JGN-PLANT1`)
- **Focus:** CNC Machining, Precision Turning, High-Tolerance Component Milling.
- **Lines Deployed:** Line 1 (CNC Milling Cell), Line 2 (Automated Turning & Lathe Line).
- **Target Products:** Precision Transmission Shaft (PTS-204), CNC Aluminum Housing (ALH-901).
- **Operational Shift Pattern:** 2 Shifts (Morning 06:00 - 14:00, General 14:00 - 22:00) with 45 minutes allocated for tea and lunch breaks.

#### Plant 2: Bommasandra Assembly & Molding Plant (`BMS-PLANT2`)
- **Focus:** Plastic Injection Molding, Sub-Assembly, Final Inspection & Packaging.
- **Lines Deployed:** Line 3 (High-Tonnage Injection Molding Cell), Line 4 (Sub-Assembly Conveyor).
- **Target Products:** Molded Electronic Enclosure (ENC-505), Wiring Harness Module (WHM-300).
- **Operational Shift Pattern:** 3 Continuous Shifts (Shift A, Shift B, Night Shift C).

---

### 3. Project Scope & Deliverables
1. **Core Platform Delivery:** Backend REST API service, Socket.IO real-time telemetry server, MongoDB transactional schemas, and responsive React SPA interface.
2. **Shop-Floor PWA:** Tablet-optimized execution portal supporting barcode scanner inputs, offline queuing, and touch-first booking.
3. **Hardware & Adapter Integration:** Industrial simulation layer supporting OPC UA and MQTT telemetry data streams (spindle speed, vibration, motor temperature, piece counts).
4. **Data Migration & Master Data Seeding:** Pre-configured plant structures, machines, BOMs, standard operating procedures, and 8 role profiles.
5. **Quality & Traceability Suite:** Digital inspection travelers, automated Non-Conformance logging, forward/backward genealogy query engine.
6. **Disaster Recovery & Automation:** Containerized Docker Compose environment with automated daily backup routines and restore verification.

---

### 4. Milestone Schedule

```
+--------------------------------------------------------------------------------+
| Phase 1: Architecture, Core Schemas & Authentication             [COMPLETED]   |
| Phase 2: Planning, Gantt Scheduler & Work Order State Machine    [COMPLETED]   |
| Phase 3: Shop-Floor Execution, BOM Auto-Consumption & Traceability [COMPLETED]   |
| Phase 4: Quality Inspection, Non-Conformance & Containment Holds   [COMPLETED]   |
| Phase 5: Automated E2E Verification & Test Suite Execution        [PASSED 18/18]|
| Phase 6: Frontend SPA & Tablet PWA Implementation                 [COMPLETED]   |
| Phase 7: Multi-Plant Docker Deployment & Customer Sign-off        [COMPLETED]   |
+--------------------------------------------------------------------------------+
```

---

### 5. Success Criteria & Customer Sign-off
- **100% Pass Rate** on all 15 customer-mandated E2E integration scenarios.
- **Zero Data Loss** in shop-floor offline simulation tests.
- **Instantaneous Real-Time Broadcasts** of downtime and Andon alerts to supervisors.
- **Successful Verification of Docker Deployment** with database persistence and backup integrity.
