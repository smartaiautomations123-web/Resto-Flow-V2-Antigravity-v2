# RestoFlow: Development Roadmap & Feature Gaps

This document identifies exactly what is currently functional in the codebase vs. what is still required to reach the "100% Production Vision" outlined in our new documentation.

---

## 🏗️ 1. THE BIG GAP: "THE BRAIN" & AI SUITE (Target: Phase 1)
*This is the most critical addition for your Investor USP.*

*   **AI Chat Agent (Status: Not Started):** 
    *   Need to build the floating chat UI/interface.
    *   Need to implement the backend RAG (Retrieval-Augmented Generation) logic to allow the AI to read the 67 database tables.
*   **Proactive Prompting (Status: Not Started):**
    *   Need to build the "Nudge" engine that monitor variances (e.g., Labour vs Sales) and sends alerts to the chat agent.
*   **AI Forecasting (Status: Basic logic only):**
    *   Need to upgrade the current basic trend-lines to a high-fidelity ML model (94%+ accuracy) that pulls in weather and event data.

---

## 📦 2. INVENTORY & SUPPLY CHAIN (Status: 60% Built)
*Focus: Automating the manual friction.*

*   **Lead Time Management:** Tracking how long suppliers take to deliver so the AI knows when to reorder.
*   **3-Way Matching:** Automatically verifying that the **Purchase Order** matches the **Invoice** and the **Physical Receipt** (Zero overpayment).
*   **Low-Level Automation:** Auto-receiving deliveries via QR scanning and EDI/API integrations with major food vendors.
*   **Calculated Production:** Templates for "Prep" (e.g., how much sauce to make today based on the sales forecast).

---

## 👥 3. LABOUR & COST CONTROL (Status: 70% Built)
*Focus: Trust and Verification.*

*   **Verification Hardware:** GPS clock-in verification, Geofencing (ensuring staff are on-site), and potential Biometric/Facial recognition support.
*   **Advanced PTO:** Full sick-leave, holiday accrued, and vacation management workflow.
*   **Tip Management:** Automated tip pooling algorithms based on hours worked vs. performance.

---

## 📈 4. INTEGRATIONS & SCALING (Status: 40% Built)
*Focus: The Enterprise Ecosystem.*

*   **Accounting ERP:** Full sync to **QuickBooks** and **Xero** (Syncing Z-reports and Purchase Orders into the General Ledger).
*   **HR & Payroll:** Direct export to payroll providers like **ADP** or **Sage**.
*   **Custom Webhook Builder:** Allowing enterprise customers to ping their own apps when an event happens (e.g., "Table 1 has been sitting for 2 hours").

---

## 🎨 5. BRANDING & UI REFINEMENT (Status: 85% Built)
*Focus: The "Premium" Look.*

*   **Branding Engine:** Ability for owners to upload their own **Logo**, change **Theme Colors**, and customize **Email/Receipt Templates** visually.
*   **Custom Report Builder:** An advanced UI to build "X vs Y" reports (e.g., "Vegan Burger sales on Rainy Tuesdays").

---

## 🛠️ TECHNICAL DEBT (Phase 0 - Non-Functional)
*Before adding features, these must be resolved:*
1.  **Fix 77 Failing Tests:** Align Zod input schemas with test data.
2.  **Resolve TypeScript Errors:** Fix 116 property mismatches in the frontend for a clean build.
3.  **Z-Report Logic:** Implement the missing tRPC procedures for shift-based reconciliation.

---

## 🏁 SUMMARY: THE ROAD TO 100%
RestoFlow is currently a **POWERFUL CORE POS & OPERATIONS TOOL**. 
To become the **AI-DRIVEN MARKET LEADER**, the next 3 months should focus heavily on **The Brain (AI Agent)** and **Ecosystem Integrations (Accounting/ERP)**. 
