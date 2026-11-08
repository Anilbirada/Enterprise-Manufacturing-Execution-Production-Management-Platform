# SYSTEM ADMINISTRATOR MANUAL
## RSR Factory360 MES: Governance & Configuration Guide

---

### 1. Initial First-Administrator Setup
When booting RSR Factory360 on a clean database without existing accounts:
1. Access the web interface at `http://<server-ip>/`. The system will automatically detect the absence of an administrator and route to `/setup-admin`.
2. Fill in the administrator registration form:
   - **Full Name:** (e.g., Anil)
   - **Administrator Email:** (e.g., `admin@rsrtechnologies.com`)
   - **Master Password:** Must be at least 8 characters.
   - **Organization Name:** (e.g., RSR Technologies)
   - **Initial Plant Name & Code:** (e.g., Jigani Plant 1 / `JGN-PLANT1`)
3. Submit the form. The system provisions the master tenant, creates the initial plant hierarchy, seeds default roles, and grants root `*` permissions.
4. *Subsequent calls to the setup endpoint are permanently disabled.*

---

### 2. User & Role Management (`/users`)
RSR Factory360 includes 8 predefined enterprise manufacturing roles:

1. **System Administrator:** Unrestricted access (`*`), user creation, plant configuration, audit log inspection.
2. **Plant Manager:** Factory-wide visibility, OEE dashboards, production performance reports, downtime trends.
3. **Production Manager:** Work order creation, Gantt scheduling, line assignments, priority dispatching.
4. **Shift Supervisor:** Shift monitoring, operator dispatching, downtime and Andon resolution.
5. **Machine Operator:** Production execution, good/scrap piece booking, micro-stop reporting, Andon raising.
6. **Quality Manager / Inspector:** First-off inspection, in-process sampling, Non-Conformance (NCR) generation, Quality Holds & Releases.
7. **Maintenance Engineer:** PM work orders, breakdown response, MTBF/MTTR tracking, spare part logs.
8. **Warehouse Manager:** Raw material receipts, inventory adjustments, BOM issue logging.

To add a new user:
- Navigate to **18. User Management** -> **Add New User**.
- Specify full name, email, plant assignment, role, and temporary password.
- Toggle active/suspended status as personnel changes occur.

---

### 3. Factory Master Data Configuration (`/settings`, `/lines`, `/machines`)
- **Adding Production Lines:** Go to **5. Production Lines** -> **Add Line**. Specify Line Code, Name, Plant Assignment, and Hourly Capacity.
- **Adding Machines:** Go to **6. Machines & Equipment** -> **Add Machine**. Define Machine Code, Machine Name, Line Link, and Standard Cycle Time in seconds (used for Performance OEE calculation).
- **Shift & Planned Break Setup:** Go to **7. Shift Management**. Define shift start and end times, and configure planned tea/lunch breaks. *Ensure break minutes are accurately declared so the OEE engine excludes breaks from Planned Production Time.*

---

### 4. Audit Trail & Security Compliance (`/audit`)
- Every sensitive system transaction is permanently recorded in the immutable `AuditLog` collection.
- Recorded parameters include: Timestamp, User ID, User Name, User Role, Action (e.g., `ORDER_STATUS_CHANGE`, `QUALITY_HOLD_PLACED`, `PERMISSION_DENIED`), Resource ID, Client IP Address, and Changes Payload.
- Filter audit logs by date, user, or action type for ISO 9001 and IATF 16949 audit preparation.

---

### 5. Automated Backups & Disaster Recovery
- Production backups run automatically via cron using `docker/backup.sh`.
- Daily archives are compressed and stored at `/var/backups/rsrfactory360` with a 30-day rolling retention policy.
- To execute a manual backup or disaster recovery restore, refer to `docs/12_DEPLOYMENT_GUIDE.md`.
