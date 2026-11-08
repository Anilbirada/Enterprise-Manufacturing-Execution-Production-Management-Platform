# SYSTEM ARCHITECTURE DOCUMENT
## RSR Factory360 MES Platform

---

### 1. High-Level Architectural Overview

RSR Factory360 follows an enterprise 3-tier microservice-ready architecture designed for low latency, high concurrency, and reliable shop-floor data capture.

```mermaid
flowchart TD
    subgraph Clients["Client Presentation Layer"]
        A1["Desktop Browser (Management Experience)"]
        A2["Shop-Floor Tablet PWA (Operator Mode)"]
        A3["Handheld Barcode Scanner"]
    end

    subgraph Ingress["Ingress & Gateway Layer"]
        B["Nginx Reverse Proxy & SSL Termination (:80/:443)"]
    end

    subgraph AppLayer["Application Layer (Node.js / Express / TypeScript :5000)"]
        C1["JWT Auth & Permission Middleware"]
        C2["Audit Logger Middleware"]
        C3["REST API Controllers (21 Modules)"]
        C4["Business Service Layer (OEE, FSM, Quality, Execution)"]
        C5["Socket.IO Real-Time Server"]
        C6["Industrial Simulation Adapter (OPC UA / MQTT)"]
    end

    subgraph DataLayer["Persistence & Caching Layer"]
        D1[("MongoDB Database (Mongoose Schemas & Indexes)")]
        D2[("Redis In-Memory Cache & Job Queue")]
    end

    subgraph Storage["Storage & Backups"]
        E1["Automated Daily Backups (/var/backups)"]
    end

    A1 -->|HTTPS / REST| B
    A2 -->|HTTPS / REST / WebSocket| B
    A3 -->|Barcode Scan| A2

    B -->|Proxy /api/| C3
    B -->|Proxy /socket.io/| C5

    C1 --> C3
    C2 --> C3
    C3 --> C4
    C4 --> D1
    C4 --> D2
    C6 --> C5
    C5 -->|Real-time Telemetry Push| A1
    C5 -->|Real-time Andon Alert| A2

    D1 -->|Automated Cron Dump| E1
```

---

### 2. Frontend Architecture (React + TypeScript + Vite)
- **State Management & Data Fetching:** `@tanstack/react-query` for declarative server state synchronization, query caching, and optimistic updates.
- **Styling & UI Components:** `Tailwind CSS` with custom industrial dark/light surfaces (`industrial-900`, `industrial-950`, `cyan-400`, `rose-600`, `amber-500`, `emerald-500`).
- **Data Visualization:** `Recharts` for interactive production trend lines, OEE gauge radial charts, and downtime Pareto distributions.
- **Offline Resilience:** Custom `ApiService` offline queue in `localStorage`. Captures operator POST/PUT requests during Wi-Fi dropouts and syncs automatically when connection is re-established.
- **Responsive Dual Layout:**
  - **Management Experience:** Dense data tables, filters, Gantt scheduling, audit logs, and analytics.
  - **Shop-Floor Experience:** High touch targets ($\ge 48\text{px}$), barcode scanner input focus, single-tap scrap logging, and prominent emergency Andon buttons.

---

### 3. Backend Architecture (Express + TypeScript)
- **Strict Layered Separation:**
  1. `routes/`: Routing definitions and middleware mounts.
  2. `middlewares/`: Authentication (`authenticateJWT`), RBAC enforcement (`requirePermission`), audit trail logger (`auditMiddleware`), centralized error handler (`errorHandler`).
  3. `controllers/`: HTTP payload validation, parameter extraction, and status code responses.
  4. `services/`: Encapsulated domain logic:
     - `workOrderService.ts`: FSM state transitions and validation.
     - `productionExecutionService.ts`: Idempotent booking, BOM auto-deduction, stock ledger logging.
     - `oeeService.ts`: Availability, Performance, Quality, and OEE aggregation.
     - `qualityService.ts`: Inspection results, auto-NCR creation, quality holds.
     - `traceabilityService.ts`: Forward/backward lot genealogies.
  5. `adapters/`: External protocol integration:
     - `industrialSimulationAdapter.ts`: OPC UA / MQTT simulation generating machine telemetry (spindle RPM, temperature, vibration) without dangerous writes to physical PLCs.
     - `notificationAdapter.ts`: Socket.IO room broadcasting based on `plantId`.
     - `erpAdapter.ts`: CSV and Excel data export and import processing.

---

### 4. Database Persistence Layer (MongoDB + Mongoose)
- **Multi-Plant Tenancy:** Every operational document carries a `plantId` reference indexed with query predicates for fast query execution.
- **Zero In-Memory Volatility:** In production, data persists in MongoDB container volumes (`mongo-data`). For zero-dependency standalone execution (testing or developer sandboxes), automatic fallback to `mongodb-memory-server` is supported.
- **Indexes:** Compound indexes on `(plantId, status)`, `(plantId, orderNumber)`, `(machineId, timestamp)`, and `(batchNumber)`.
