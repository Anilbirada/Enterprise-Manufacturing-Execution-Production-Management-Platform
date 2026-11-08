# DEVELOPMENT TASK BREAKDOWN (WBS)
## RSR Factory360 MES Implementation Work Packages

---

### Work Package 1: Foundation & Security
- **WP-1.1:** Setup Express & TypeScript scaffolding with unified database connection (`db.ts`).
- **WP-1.2:** Implement JWT token issuance, verification, and first-time admin initialization flow.
- **WP-1.3:** Implement RBAC permission matrix for 8 roles with automated audit logging on access denial.
- **WP-1.4:** Seed initial factory topology for Jigani Plant 1 and Bommasandra Plant 2.

### Work Package 2: Factory Master Data & Data Schemas
- **WP-2.1:** Create Mongoose models for Organizations, Sites, Plants, Departments, Lines, Machines.
- **WP-2.2:** Create Models for Products, Materials, Multi-level Bills of Materials (BOM), and Routings.
- **WP-2.3:** Build Shift master with planned break schedules (15m Tea, 30m Lunch).
- **WP-2.4:** Build Master Data REST controllers with multi-plant scoping.

### Work Package 3: Production Planning & Work Orders
- **WP-3.1:** Implement Work Order state machine (`workOrderService.ts`) enforcing valid status flow.
- **WP-3.2:** Develop Gantt scheduling endpoint calculating start/end times and capacity conflicts.
- **WP-3.3:** Build drag-and-drop React planning interface with backlog drawer.
- **WP-3.4:** Implement overdue order detection and prioritization controls.

### Work Package 4: Production Execution & Operator Shop-Floor
- **WP-4.1:** Develop shop-floor operator tablet interface with touch targets ($\ge 48\text{px}$).
- **WP-4.2:** Implement idempotent production booking service (`productionExecutionService.ts`).
- **WP-4.3:** Implement automated BOM raw material deduction and inventory stock ledger logging.
- **WP-4.4:** Integrate client-side offline action queue for network disconnection recovery.

### Work Package 5: Quality Assurance & Containment
- **WP-5.1:** Build Inspection recording service supporting Receiving, First-Off, In-Process, and Final.
- **WP-5.2:** Implement automated Non-Conformance (NCR) generation upon scrap or defect detection.
- **WP-5.3:** Build Quality Hold engine preventing execution of quarantined orders, batches, or machines.
- **WP-5.4:** Implement formal Release workflow requiring inspector justification.

### Work Package 6: OEE Analytics, Downtime & Andon
- **WP-6.1:** Implement mathematical OEE calculation engine (`oeeService.ts`) with planned break deduction.
- **WP-6.2:** Develop Downtime event tracker with categorised Pareto analysis.
- **WP-6.3:** Implement Socket.IO real-time Andon alert broadcasting with supervisor acknowledgement.
- **WP-6.4:** Implement Industrial machine simulation adapter (OPC UA / MQTT) streaming live spindle metrics.

### Work Package 7: Traceability, Maintenance & Reporting
- **WP-7.1:** Implement forward and backward genealogy aggregation engine (`traceabilityService.ts`).
- **WP-7.2:** Integrate QR and barcode digital traveler generator.
- **WP-7.3:** Build Preventive and Breakdown Maintenance Work Order module.
- **WP-7.4:** Build Excel and CSV export service (`erpAdapter.ts`).

### Work Package 8: Testing, DevOps & Containerization
- **WP-8.1:** Develop comprehensive 18-scenario automated integration test suite in Jest.
- **WP-8.2:** Author production Dockerfiles for Backend (Node.js) and Frontend (Nginx).
- **WP-8.3:** Create root `docker-compose.yml` with MongoDB, Redis, and healthchecks.
- **WP-8.4:** Author automated backup (`backup.sh`) and restoration (`restore.sh`) scripts.
- **WP-8.5:** Compile complete user and administrator documentation.
