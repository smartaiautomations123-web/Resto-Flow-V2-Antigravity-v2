# RestoFlow AI Implementation Prompts & Roadmap
*Preserved from chat ID: cccd9482-d435-4956-9ff5-e9a8204db681*

This document captures the master prompt list we developed to finish the remaining features of the RestoFlow platform.

---

## 🛠️ PHASE 0: SYSTEM STABILITY & DEBT
**Goal:** Fix existing bugs to create a clean foundation for new features.

### **Prompt 0.1: Fix Test Input Validation**
> "I have 77 failing tests in my RestoFlow project due to Zod schema mismatches. Please analyze the server router schemas (e.g., `zReports`, `priceUploads`, `floorPlan`) and compare them to the input data being sent in the `.test.ts` files."

### **Prompt 0.2: Resolve Financial SQL Errors**
> "The `financial-analytics` procedures in my RestoFlow project are throwing SQL syntax errors (specifically around `clockInTime` vs `clockIn`). Please audit the Drizzle ORM queries..."

### **Prompt 0.3: Complete zReport Procedures**
> "The `zReports` tRPC router is missing several backend procedures. Please implement the full CRUD for `zReports`."

---

## 🤖 PHASE 1: THE BRAIN & AI CHAT AGENT
**Goal:** Implement the primary AI USP.

### **Prompt 1.1: Build the AI Chat Agent UI**
> "I need to create a new frontend component called `AiChatAgent.tsx`. It should be a floating, retractable chat bubble in the bottom-right of the dashboard... Style it using Tailwind CSS 4 to match the premium dark-mode aesthetic of RestoFlow."

### **Prompt 1.2: Implement the AI Agent Logic**
> "Create a new tRPC router called `aiAgent`. Implement a procedure `queryBrain` that accepts a text string. The backend should use an LLM (like Gemini) to analyze the existing database schema and return a natural language answer."

### **Prompt 1.3: Build the 'Proactive Nudge' System**
> "Implement a background observer in the `aiAgent` or `reports` router that triggers every hour. It should check for variances... If a variance is found, it should insert a 'Proactive Prompt' into the `notifications` table."

---

## 🔮 PHASE 2: ADVANCED FORECASTING & ROI
**Goal:** Deepen the logic and reporting.

### **Prompt 2.1: Predictive Sales & Labour Model**
> "Enhance the `forecasting` router. Implement a predictive model that analyzes historical `orders` data and `dayparts` to generate a 7-day sales forecast."

### **Prompt 2.2: AI Stock & Waste Guard**
> "Implement an AI Stock Prediction module in the `inventory` router. It must analyze the past 24 months of ingredient usage to predict demand for the next 14 days."

---

## 📉 PHASE 3: INTEGRATIONS & ECOSYSTEM
**Goal:** Finalize the enterprise capabilities.

### **Prompt 3.1: QuickBooks/Xero Sync Prep**
> "I need to build an export service for the General Ledger. Create a utility that aggregates the daily `zReports` data and formats it into a JSON structure."

### **Prompt 3.2: GPS Clock-In Verification**
> "Update the `clockIn` procedure in the `staff` router. Modify the input schema to require latitude and longitude coordinates. Compare these coordinates against the `location` coordinates stored in the DB."
