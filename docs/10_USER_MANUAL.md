# SHOP-FLOOR USER MANUAL
## RSR Factory360 MES: Operator & Supervisor Guide

---

### 1. Introduction for Shop-Floor Teams
RSR Factory360 MES connects your machine workstation directly to production planning, quality, and maintenance. This manual guides operators and shift supervisors on executing day-to-day manufacturing tasks.

---

### 2. Logging In & Selecting Plant
1. Launch the tablet or browser at `http://<factory-ip>`.
2. Enter your assigned email/employee ID and password.
3. At the top right of the navigation bar, ensure your active plant is selected (e.g., `JGN-PLANT1` Jigani or `BMS-PLANT2` Bommasandra).
4. For shop-floor operators, navigate directly to **4. Production Execution** (`/execution`).

---

### 3. Production Execution Workflow (Operators)

#### Step 1: Loading a Work Order
- **Using a Barcode Scanner:** Click into the "Scan Work Order Traveler" field and scan the 2D QR code on the traveler sheet. The order details, target quantity, and routing steps will load immediately.
- **Manual Selection:** Select the assigned Work Order from the dropdown list.

#### Step 2: Starting the Job
- Review the digital work instructions and routing sequence on the screen.
- Verify machine status is green (`RUNNING`).
- Click **Start Operation**. The order status updates to `IN PROGRESS` and shift cycle tracking begins.

#### Step 3: Booking Completed & Scrapped Parts
- **Good Pieces:** Enter the completed quantity (e.g., 25 pieces) and tap **Book Production**. The system records the pieces, updates machine runtime, and automatically deducts required raw materials from the warehouse stock ledger.
- **Scrap Pieces:** If defects occur, enter the scrap quantity and select the defect reason (e.g., *Burr / Flash*, *Dimensional Out of Spec*, *Tool Wear*). The system automatically records the scrap and alerts the Quality department.

---

### 4. Machine Downtime & Micro-Stop Reporting
1. If your machine halts due to breakdown, tool change, or material starvation, tap **Report Downtime**.
2. Select the reason category:
   - *Mechanical Failure*
   - *Electrical Fault*
   - *Tooling / Insert Wear*
   - *Material Starvation*
   - *Setup / Changeover*
3. The machine status changes to Red (`DOWNTIME`).
4. Once the issue is resolved and the machine restarts, click **Resolve Downtime**. The system automatically calculates total lost production minutes.

---

### 5. Triggering & Resolving Andon Alarms
1. In the event of a safety emergency, quality crisis, or urgent need for supervisor assistance, tap the large **Andon Alert** button.
2. Select severity:
   - **Critical (Red):** Machine stopped, immediate line hazard, or consecutive scrap parts.
   - **Warning (Amber):** Upcoming material shortage or minor tooling adjustment needed.
3. The supervisor's dashboard and the shop-floor Andon display will flash and chime immediately.
4. Once the supervisor assists, they tap **Acknowledge**, rectify the condition, and tap **Resolve** with sign-off notes.

---

### 6. Offline Mode & Auto-Synchronization
- If the factory Wi-Fi drops momentarily, a banner will appear: **"Operating in Offline Cache Mode"**.
- Continue booking parts normally. All actions are securely cached on the local tablet storage.
- When Wi-Fi reconnects, the system automatically synchronizes cached entries with the central database and displays: **"All offline actions synchronized successfully"**.
