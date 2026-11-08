# CUSTOMER USER ACCEPTANCE TESTING (UAT) CHECKLIST
## RSR Factory360 MES Platform Sign-Off

**Client:** RSR Technologies  
**Project Owner / Technical Lead:** Anil  
**Target Locations:** Jigani Complex (Plant 1) & Bommasandra Complex (Plant 2)  
**Testing Sign-Off Date:** Q1 2026  

---

### Acceptance Criteria & Verification Matrix

| # | Feature / Scenario Under Test | Acceptance Standard | Status | Sign-off |
| :-: | :--- | :--- | :-: | :-: |
| **01** | **System Bootstrap & First-Admin** | When clean DB boots, user is prompted to register master admin. Subsequent registrations disabled. | **PASSED** | Accepted |
| **02** | **Multi-Plant Context Switching** | User can seamlessly toggle between Jigani and Bommasandra plants; headers filter data automatically. | **PASSED** | Accepted |
| **03** | **Role-Based Access Control** | Operators cannot view financial reports; Supervisors cannot delete plants; unauth access blocked & audited. | **PASSED** | Accepted |
| **04** | **Master Data Consistency** | Duplicate machine/product codes blocked; hierarchical association (Plant -> Line -> Machine) enforced. | **PASSED** | Accepted |
| **05** | **Gantt Scheduling** | Production manager can visually schedule orders across lines; capacity conflicts flagged. | **PASSED** | Accepted |
| **06** | **Work Order State Machine** | Strict progression enforced: Draft -> Planned -> Released -> In Progress -> Completed. Invalid jumps rejected. | **PASSED** | Accepted |
| **07** | **Idempotent Operator Booking** | Double clicks or network retries do not duplicate completed piece counts or material consumption. | **PASSED** | Accepted |
| **08** | **Automated BOM Deduction** | Recording finished goods automatically consumes raw materials based on active BOM in stock ledger. | **PASSED** | Accepted |
| **09** | **Real-Time Machine Telemetry** | Spindle speed, motor temperature, and vibration stream in real time via WebSockets to operator screens. | **PASSED** | Accepted |
| **10** | **Downtime & Micro-Stops** | Unplanned line stops categorized by Mechanical, Electrical, Tooling, Quality; duration tracked. | **PASSED** | Accepted |
| **11** | **Real-Time Andon Escalation** | Critical line alerts flash immediately on supervisor dashboards; unacknowledged alerts escalate. | **PASSED** | Accepted |
| **12** | **First-Off & In-Process Inspection** | Quality checklists recorded digitally; scrap triggers automatic Non-Conformance Report (NCR). | **PASSED** | Accepted |
| **13** | **Quality Containment Hold** | Active hold on an order or machine instantly prevents further operator bookings until released. | **PASSED** | Accepted |
| **14** | **OEE Mathematical Engine** | Availability correctly deducts 45m planned breaks; Performance & Quality calculated without manual fudge factors. | **PASSED** | Accepted |
| **15** | **Forward & Backward Traceability** | Scanning any batch QR code yields full genealogy: operator, machine, shift, inspection, and raw material lots. | **PASSED** | Accepted |
| **16** | **PWA Offline Resilience** | Disconnected tablet bookings are stored locally and sync without data loss upon network reconnection. | **PASSED** | Accepted |
| **17** | **Reports & ERP Exports** | Production summary, OEE metrics, and scrap logs export cleanly to Excel and CSV formats. | **PASSED** | Accepted |
| **18** | **Containerized Deployment & DR** | System runs cleanly via Docker Compose; daily automated backup and restoration scripts verified. | **PASSED** | Accepted |

---

### Customer Sign-Off Confirmation
- **Project Lead / Dev Architect:** Anil (RSR Technologies)
- **Deployment Status:** Approved for Production Staging & Rollout
- **Conformance Statement:** RSR Factory360 MES satisfies all contractual specifications, functional requirements, and architecture guidelines.
