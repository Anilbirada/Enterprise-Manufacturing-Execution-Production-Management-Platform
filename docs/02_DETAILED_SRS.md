# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## RSR Factory360 MES Platform

**Document Version:** 1.0.0  
**Status:** Approved  
**System Architecture:** Multi-tier RESTful API & WebSocket Microservices  

---

### 1. Functional Requirements by Module

#### 1.1 Authentication & Security (AUTH-REQ)
- **AUTH-01:** System must enforce JWT authentication using HMAC SHA-256 with 24-hour expiration tokens.
- **AUTH-02:** First-time bootstrap must detect an empty user base and force secure administrator onboarding via `/api/auth/setup-admin`.
- **AUTH-03:** Granular Role-Based Access Control (RBAC) must authorize requests based on 8 predefined roles: System Administrator, Plant Manager, Production Manager, Shift Supervisor, Machine Operator, Quality Inspector, Maintenance Engineer, Warehouse Manager.
- **AUTH-04:** Unauthorized endpoint requests must reject with HTTP 403 and immediately record an audit event to the `AuditLog` collection.

#### 1.2 Master Data & Factory Topology (MAST-REQ)
- **MAST-01:** Hierarchy must model Organization -> Site -> Plant -> Department -> Production Line -> Workstation -> Machine.
- **MAST-02:** Production lines and machines must belong to a specific `plantId` for multi-plant partitioning.
- **MAST-03:** Products must specify SKU code, name, category, standard cycle time (seconds), and active BOM reference.
- **MAST-04:** Shifts must support configurable start/end times and structured planned breaks (e.g., 15m Morning Tea, 30m Lunch) to ensure break duration is deducted from planned production time.

#### 1.3 Production Planning & Work Orders (PLAN-REQ)
- **PLAN-01:** Work order state machine must strictly enforce valid transitions:
  $$\text{Draft} \longrightarrow \text{Planned} \longrightarrow \text{Released} \longrightarrow \text{In Progress} \longleftrightarrow \text{Paused} \longrightarrow \text{Completed}$$
  Any attempt to start an unreleased order must return HTTP 400.
- **PLAN-02:** Overdue detection must automatically flag orders where `dueDate < Date.now()` and status is not `Completed`.
- **PLAN-03:** If a quality hold is active against a Work Order, the state machine must reject state transitions into `In Progress` or `Completed`.

#### 1.4 Production Execution & Operator Shop-Floor (EXEC-REQ)
- **EXEC-01:** Operator interface must provide high-contrast touch controls with minimum touch targets of 48x48px.
- **EXEC-02:** Production bookings (`goodQuantity`, `scrapQuantity`, `reworkQuantity`) must be idempotent based on unique operation sequence keys.
- **EXEC-03:** On production booking, the system must automatically deduct raw materials according to the active BOM and record corresponding `InventoryTransaction` entries (Stock Out).
- **EXEC-04:** Production booking must auto-increment the machine cumulative piece count and update machine runtime.
- **EXEC-05:** Shop-floor tablet offline action queue must store pending bookings in browser local storage and synchronize upon network restoration.

#### 1.5 Quality Management & Containment (QUAL-REQ)
- **QUAL-01:** Support inspection types: Receiving, First-Off, In-Process, Final Inspection, and PDI.
- **QUAL-02:** When an inspection records `rejectedQuantity > 0`, the system must auto-generate a Non-Conformance Report (NCR) with severity and defect categorization.
- **QUAL-03:** Quality Managers can place immediate Quality Holds on Work Orders, Batches, or Machines. Active holds must block further production execution until formally released with written justification.

#### 1.6 OEE Engine & Calculation Rules (OEE-REQ)
- **OEE-01:** Overall Equipment Effectiveness must be calculated using standard industrial formulation:
  $$\text{OEE} = \text{Availability} \times \text{Performance} \times \text{Quality}$$
  $$\text{Availability} = \frac{\text{Operating Time}}{\text{Planned Production Time}}$$
  Where $\text{Planned Production Time} = \text{Shift Duration} - \text{Planned Breaks}$.
  $$\text{Performance} = \frac{\text{Ideal Cycle Time} \times \text{Total Count}}{\text{Operating Time}}$$
  $$\text{Quality} = \frac{\text{Good Count}}{\text{Total Count}}$$
- **OEE-02:** Availability must not penalize scheduled tea/lunch breaks or planned maintenance.
- **OEE-03:** Calculation must run at Machine level, Line level, and Plant-aggregated level.

#### 1.7 Andon & Downtime Management (ANDON-REQ)
- **ANDON-01:** Operators must be able to trigger visual and audible Andon alerts categorised by Safety, Quality, Machine Breakdown, or Material Shortage.
- **ANDON-02:** Real-time WebSocket broadcasting must emit Andon status updates to all supervisor dashboards within 500ms.
- **ANDON-03:** Unacknowledged Critical Andon alerts must escalate automatically after 15 minutes.

#### 1.8 Inventory, BOM & Traceability (TRACE-REQ)
- **TRACE-01:** Unique lot/serial numbers must be assigned to production batches upon work order release.
- **TRACE-02:** System must render 2D QR codes and barcodes for digital traveler cards.
- **TRACE-03:** Complete genealogy inquiry: Forward traceability (raw material lot -> finished goods batches) and Backward traceability (finished product serial -> operator, machine, shift, inspection report, raw material lots).

---

### 2. Non-Functional Requirements (NFR)

| ID | Category | Requirement Specification |
| :--- | :--- | :--- |
| **NFR-01** | Performance | API endpoints must respond within $\le 200\text{ms}$ under 500 concurrent connections. |
| **NFR-02** | Availability | $99.9\%$ uptime during manufacturing plant operating shifts. |
| **NFR-03** | Security | All passwords hashed using `bcrypt` (10 salt rounds); JWT token validation on every private request. |
| **NFR-04** | Scalability | MongoDB horizontal sharding readiness with indexed compound keys (`plantId`, `status`, `machineId`). |
| **NFR-05** | Offline Resilience | Shop-floor PWA clients must support disconnected operations with local queue sync. |
| **NFR-06** | Browser Support | Optimized for Chrome 110+, Edge 110+, Safari iOS 16+, Firefox 115+. |
