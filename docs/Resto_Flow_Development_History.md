# Resto-Flow Development Changelog
## *Recent Features & System Upgrades*

Below is a comprehensive summary of the recent development phases and codebase enhancements applied to the Resto-Flow architecture. 

---

### 1. Dash AI & Autonomous Features
The AI assistant ("Dash") was significantly enhanced to become a proactive operational agent rather than a reactive chatbot.

*   **Proactive Nudge System:** 
    *   Implemented a notification routing system that greets users upon opening the chat with critical operational alerts.
    *   *Examples:* Notifies managers if daily labor costs exceed forecasted budgets by >10% or if specific ingredients drop below required reorder points.
*   **Voice-to-Chat Functionality:**
    *   Integrated raw `SpeechRecognition` web APIs allowing hands-free interaction with Dash for fast-paced kitchen environments.
    *   Added visual "listening" cues (pulsing animations) for clear UI feedback.
*   **Automated Purchase Order Generation:**
    *   Added a `create_draft_purchase_order` tool granting Dash the ability to scan the `ingredients` table.
    *   Dash now automatically groups low-stock items by supplier and generates Draft POs in `purchase_orders`.
*   **Live Staff Shift Intelligence:**
    *   Added a `get_staff_on_shift` tool that joins `time_clock` and `staff` tables. Dash can now answer conversational queries regarding who is currently clocked in.

### 2. Enterprise Security & Safety Mechanisms
To balance AI autonomy with enterprise-grade safety, robust confirmation workflows were introduced.

*   **AI Mutation "Confirmation Gates":**
    *   Implemented strict safeguards preventing Dash from running destructive or mutating SQL queries autonomously out-of-the-box.
    *   Any `UPDATE`, `INSERT`, `DELETE`, `DROP`, or `ALTER` requires a human-in-the-loop validation via a clear UI preview before the AI transaction is committed.
*   **Test Environment Stabilization:**
    *   Refactored the core database connectivity layer (`db.ts` / server routers) to gracefully handle null scenarios. 
    *   Ensured operations fail safely during testing so unit tests run cleanly without live environments.

### 3. Hyper-Scale Administration & Mission Control
System controls were enhanced to allow for easier white-labelling and cross-restaurant management.

*   **Dynamic Branding Center:**
    *   Created the `BrandingSettings.tsx` application module managing white-label configuration.
    *   Implemented real-time deep CSS variable injection (`--primary`, etc.), altering the visual footprint of the entire app instantly without redeployment.
    *   Wired branding preferences into the core `system_settings` database schema.
*   **Centralized Configuration Routing:**
    *   Linked new settings panels directly to global application navigation securely, ensuring no cross-contamination between specific client deployments.

### 4. Apple Developer Account Strategy
*   **Subscription Product Architecture:**
    *   Analyzed and structured the strategy resolving an Apple App Store rejection related to "no package" errors.
    *   Defined the systematic rollout for recreating Premium Subscription Groups under proper legal entity structures.
