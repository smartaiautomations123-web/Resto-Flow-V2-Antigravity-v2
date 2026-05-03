# RestoFlow: AI Agent Implementation Prompts

Use the following prompts in order to complete the development of the RestoFlow application. These are designed to be used with an AI coding assistant (like Antigravity) to execute the remaining phases of the roadmap.

---

## 🛠️ PHASE 0: SYSTEM STABILITY & DEBT
**Goal:** Fix existing bugs to create a clean foundation for new features.

### **Prompt 0.1: Fix Test Input Validation**
> "I have 77 failing tests in my RestoFlow project due to Zod schema mismatches. Please analyze the server router schemas (e.g., `zReports`, `priceUploads`, `floorPlan`) and compare them to the input data being sent in the `.test.ts` files. Update the test inputs to match the expected Zod types perfectly so all tests pass."

### **Prompt 0.2: Resolve Financial SQL Errors**
> "The `financial-analytics` procedures in my RestoFlow project are throwing SQL syntax errors (specifically around `clockInTime` vs `clockIn`). Please audit the Drizzle ORM queries in my financial/reporting routers and fix column name mismatches. Simplify complex raw SQL queries into clean Drizzle queries where possible."

### **Prompt 0.3: Complete zReport Procedures**
> "The `zReports` tRPC router is missing several backend procedures. Please implement the full CRUD for `zReports`, including `createZReport` (which aggregates all daily orders), `getZReportByLocation`, and `reconcileShiftCash`. Ensure they link correctly to the `z_reports` and `z_report_items` tables."

---

## 🤖 PHASE 1: THE BRAIN & AI CHAT AGENT
**Goal:** Implement the primary AI USP.

### **Prompt 1.1: Build the AI Chat Agent UI**
> "I need to create a new frontend component called `AiChatAgent.tsx`. It should be a floating, retractable chat bubble in the bottom-right of the dashboard. It should allow natural language input and display a conversation history. Style it using Tailwind CSS 4 to match the premium dark-mode aesthetic of RestoFlow."

### **Prompt 1.2: Implement the AI Agent Logic**
> "Create a new tRPC router called `aiAgent`. Implement a procedure `queryBrain` that accepts a text string. The backend should use an LLM (like Gemini) to analyze the existing database schema (Orders, Inventory, Staff) and return a natural language answer. Focus on data retrieval like 'What were the sales for yesterday?'."

### **Prompt 1.3: Build the "Proactive Nudge" System**
> "Implement a background observer in the `aiAgent` or `reports` router that triggers every hour. It should check for variances (e.g., if real-time Labour Cost exceeds the daily Forecast by more than 10%). If a variance is found, it should insert a 'Proactive Prompt' into the `notifications` table for the AI Chat Agent to display."

---

## 🔮 PHASE 2: ADVANCED FORECASTING & ROI
**Goal:** Deepen the logic and reporting.

### **Prompt 2.1: Predictive Sales & Labour Model**
> "Enhance the `forecasting` router. Implement a predictive model that analyzes historical `orders` data and `dayparts` to generate a 7-day sales forecast. Use this forecast to suggest a 'Recommended Schedule' for the `shifts` module."

### **Prompt 2.2: AI Stock & Waste Guard**
> "Implement an AI Stock Prediction module in the `inventory` router. It must analyze the past 24 months of ingredient usage to predict demand for the next 14 days. Cross-reference this with a 'Market Pulse' utility that fetches current vendor prices. If a core ingredient is at a record low price, the AI should prompt the user to: 'Bulk purchase [Ingredient] now – Market price is 15% below average'."

### **Prompt 2.2: Advanced Invoice Automation**
> "Update the `invoices` implementation. Add a field for 'Payment Terms' and 'Due Date'. Implement an automated job that identifies overdue invoices and triggers an 'Overdue' status and a notification prompt to the user."

---

## 📉 PHASE 3: INTEGRATIONS & ECOSYSTEM
**Goal:** Finalize the enterprise capabilities.

### **Prompt 3.1: QuickBooks/Xero Sync Prep**
> "I need to build an export service for the General Ledger. Create a utility that aggregates the daily `zReports` data and formats it into a JSON structure compatible with QuickBooks/Xero Journal Entry APIs. Ensure every transaction maps to a defined category (Revenue, Tax, Cash, Card)."

### **Prompt 3.2: GPS Clock-In Verification**
> "Update the `clockIn` procedure in the `staff` router. Modify the input schema to require latitude and longitude coordinates. Compare these coordinates against the `location` coordinates stored in the DB. If the staff is outside a 100m radius of the venue, flag the entry as 'Unverified' in the `time_clock` table."

---

## 🎨 PHASE 4: REFINEMENT & DEPLOYMENT
**Goal:** The final "WOW" factors.

### **Prompt 4.1: Custom Branding & Theme Engine**
> "Create a `BrandingSettings.tsx` page. Implement the logic to allow users to upload a Logo (storing the URL in `systemSettings`) and select a Primary Color. Update the global Tailwind CSS vars to dynamically use the primary color from the user's settings profile."
