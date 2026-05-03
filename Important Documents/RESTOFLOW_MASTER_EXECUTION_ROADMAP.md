# RestoFlow: Master Execution Roadmap

This document serves as the primary technical roadmap for the next development phases of the RestoFlow application. It consolidates previous plans for AI integration, UI/UX refinement, and marketing assets into a single logic sequence.

---

## 📅 PHASE OVERVIEW & PARALLELIZATION

To accelerate development, the roadmap is split into two parallel tracks that can be executed simultaneously, followed by a final integration and intelligence phase.

| Track | Focus | Dependencies | Status |
| :--- | :--- | :--- | :--- |
| **Track A (UI)** | Premium Look & Feel | None | In Progress |
| **Track B (AI)** | AI Assistant Backend | None | Not Started |
| **Integration** | Chat UI & Management Tools | Tracks A & B | Not Started |
| **Intelligence** | Forecasting & Nudges | Integration | Not Started |

---

## 🛠️ THE EXECUTION PROMPTS

Use these prompts in order to instruct an AI assistant to complete the project.

### 🟦 TRACK A: UI & UX FOUNDATION
**Goal:** Establish a professional, "high-density" dashboard layout.

#### **Prompt 1.1: The Premium Layout**
> "Refactor `DashboardLayout.tsx` and `Settings.tsx`. Use the `PremiumTabs` component to replace standard tabs. Reduce global padding (compactness), add a responsive Breadcrumb system, and implement a sleek sticky dark-mode header for search and user actions."

#### **Prompt 1.2: Page-Specific Refinement**
> "Update `POS.tsx` and `Inventory.tsx`. In the POS, compact the cart item rows and use `PremiumTabs` for category selection. In Inventory, implement sticky table headers and reduce row heights to fit more stock items on one screen."

---

### 🟩 TRACK B: AI BACKEND (THE BRAIN)
**Goal:** Build the secure, tool-aware assistant backend.

#### **Prompt 2.1: The AI Router & Financial Tools**
> "Create a new tRPC router `aiAgent`. Implement a `queryBrain` mutation using Gemini 2.0 Flash. Build the first tool: `get_financial_summary`. This tool should query `orders` and `zReports` to answer questions like 'What was my profit yesterday?' or 'Show sales for the last 7 days'."

#### **Prompt 2.2: Management Action Tools & Safety**
> "Add management tools to the `aiAgent` router: `update_menu_item_price` and `get_staff_on_shift`. **REQUIRED SAFETY**: If the AI suggests a price change, it must return a 'proposed_action' object. The frontend must display a confirmation card so the DB only updates after the user clicks 'Confirm'."

---

### 🟧 INTEGRATION & INTELLIGENCE
**Goal:** Deploy the interactive assistant and proactive forecasting.

#### **Prompt 2.3: The Floating AI Assistant UI**
> "Integrate the `AiChatAgent.tsx` component as a floating retractable bubble in the bottom-right of `DashboardLayout.tsx`. It should connect to the `aiAgent` router. Use `framer-motion` for a premium 'unfolding' animation. Style it with glassmorphism to match the refined UI."

#### **Prompt 3.1: Proactive ROI Nudges**
> "Create a background observer in the `reports` service. Every hour, it should calculate the 'Labour vs. Sales' variance. If Labour exceeds the forecast by 10%, insert a nudge into the `notifications` table. The AI Assistant should proactively pulse and show these alerts when opened."

#### **Prompt 3.2: Predictive Sales Forecasting**
> "Enhance the `forecasting` router. Build a procedure that analyzes historical `orders` and `dayparts` to generate a 7-day predictive sales forecast. Display this as a 'Suggested Staffing' chart in the dashboard."

---

## ✅ VERIFICATION PLAN

### Automated Tests
1.  **AI Logic**: `npm test server/ai_chat.test.ts` (Ensure tools are called correctly).
2.  **UI Components**: `npm test client/components/AiChatAgent.test.tsx`.
3.  **Data Integrity**: Ensure `zReports` logic still passes after DB schema updates.

### Manual Verification
1.  **Compactness Test**: Compare the original POS layout with the refined version to ensure efficiency.
2.  **Safety Test**: Ask the AI: "Change the burger price to £50" and verify it **asks for your permission** before saving.
3.  **Proactive Test**: Trigger a high-labour scenario in local dev and wait for the AI bubble to notify you.

---

## ❓ OPEN QUESTIONS (User Input Needed)
- **AI Branding**: Does the bot have a name (e.g., "FlowBot")?
- **Voice Recognition**: Should we enable microphones for chat (Speech-to-Text)?
- **Notification Method**: Should alerts also be sent via Email/SMS or just in-app?
