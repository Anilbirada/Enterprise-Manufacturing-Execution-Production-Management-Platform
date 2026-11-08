# API SPECIFICATIONS & ENDPOINTS DOCUMENTATION
## RSR Factory360 MES RESTful API

**Base URL:** `http://<host>:5000/api`  
**Authentication Header:** `Authorization: Bearer <jwt_token>`  
**Plant Scoping Header:** `x-plant-id: <plant_id>`  

---

### 1. Authentication & Users (`/api/auth`, `/api/users`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/auth/setup-status` | Checks if first-admin setup is required | None (Public) |
| `POST` | `/auth/setup-admin` | Registers first System Administrator | None (Only when no users exist) |
| `POST` | `/auth/login` | Authenticates user and issues JWT token | None (Public) |
| `GET` | `/auth/me` | Fetches active session profile & permissions | Authenticated |
| `GET` | `/users` | Lists all plant users | `users:manage` |
| `POST` | `/users` | Creates a new user with role & permissions | `users:manage` |
| `PUT` | `/users/:id` | Updates user details or status | `users:manage` |

---

### 2. Factory Master Data (`/api/master-data`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/master-data/organizations` | Lists manufacturing organizations | Authenticated |
| `POST` | `/master-data/organizations` | Creates organization entity | `system:configure` |
| `GET` | `/master-data/plants` | Lists manufacturing plants | Authenticated |
| `POST` | `/master-data/plants` | Creates new plant entity | `system:configure` |
| `GET` | `/master-data/lines` | Lists production lines for plant | Authenticated |
| `POST` | `/master-data/lines` | Creates production line | `lines:edit` |
| `GET` | `/master-data/machines` | Lists machines with live status | Authenticated |
| `POST` | `/master-data/machines` | Registers new machine/equipment | `machines:edit` |
| `PUT` | `/master-data/machines/:id` | Updates machine parameters or status | `machines:update_status` |
| `GET` | `/master-data/products` | Lists finished goods and parts | Authenticated |
| `POST` | `/master-data/products` | Creates new product definition | `products:edit` |
| `GET` | `/master-data/boms` | Lists Bills of Materials | Authenticated |
| `POST` | `/master-data/boms` | Defines new BOM revision | `boms:edit` |
| `GET` | `/master-data/shifts` | Lists operational shifts & break schedules | Authenticated |

---

### 3. Production Planning & Work Orders (`/api/work-orders`, `/api/planning`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/work-orders` | Lists work orders with filters (status, line) | `workorders:view` |
| `POST` | `/work-orders` | Creates new work order in Draft status | `workorders:create` |
| `PUT` | `/work-orders/:id/status` | Executes FSM transition (`Draft` -> `Planned` -> `Released` -> `In Progress` -> `Completed`) | `workorders:edit` |
| `GET` | `/planning/gantt` | Returns scheduled orders formatted for Gantt chart | `planning:view` |
| `PUT` | `/planning/reschedule` | Updates order schedule via drag-and-drop | `planning:edit` |

---

### 4. Shop-Floor Production Execution (`/api/execution`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/execution/book` | Books good, scrap, and rework quantities; triggers BOM deduction | `execution:book` |
| `GET` | `/execution/history` | Fetches production entry logs for active line | `execution:view` |
| `POST` | `/execution/start-operation`| Sets work order to `In Progress` & records operator start time | `execution:book` |

---

### 5. Downtime & Andon Alerts (`/api/downtime`, `/api/andon`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/downtime/events` | Starts machine downtime event | `downtime:record` |
| `PUT` | `/downtime/events/:id/resolve` | Resolves downtime event with duration & reason | `downtime:record` |
| `GET` | `/andon` | Lists open Andon alarms across lines | `andon:view` |
| `POST` | `/andon` | Triggers new Andon alert (safety, quality, machine) | `andon:raise` |
| `PUT` | `/andon/:id/acknowledge` | Supervisor acknowledges alert | `andon:acknowledge` |
| `PUT` | `/andon/:id/resolve` | Resolves Andon alert | `andon:resolve` |

---

### 6. Quality Management (`/api/quality`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/quality/inspections` | Lists quality inspection records | `quality:view` |
| `POST` | `/quality/inspections` | Submits inspection report (First-Off, In-Process, Final) | `quality:inspect` |
| `GET` | `/quality/ncrs` | Lists Non-Conformance Reports | `quality:view` |
| `POST` | `/quality/holds` | Places Quality Hold on Order, Batch, or Machine | `quality:holds` |
| `PUT` | `/quality/holds/:id/release` | Releases Quality Hold with justification | `quality:holds` |

---

### 7. OEE & Analytics (`/api/oee`, `/api/dashboard`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/oee/machine/:machineId` | Calculates Machine OEE (Availability, Performance, Quality) | `oee:view` |
| `GET` | `/oee/plant` | Aggregates multi-machine Plant OEE for active shift | `oee:view` |
| `GET` | `/dashboard/summary` | Executive dashboard overview KPIs | Authenticated |

---

### 8. Materials, Traceability & System (`/api/inventory`, `/api/traceability`, `/api/audit`)

| Method | Endpoint | Description | Permissions Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/inventory` | Fetches material stock ledger | `inventory:view` |
| `POST` | `/inventory/transactions` | Records Stock In, Adjustment, or Transfer | `inventory:edit` |
| `GET` | `/traceability/genealogy/:batchNumber` | Returns full forward & backward traceability tree | `traceability:view` |
| `GET` | `/audit` | Lists immutable system audit trail events | `audit:view` |
| `GET` | `/reports/export` | Generates CSV or Excel export of production data | `reports:export` |
