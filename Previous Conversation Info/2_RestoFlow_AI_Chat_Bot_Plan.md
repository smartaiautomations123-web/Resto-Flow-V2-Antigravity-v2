# AI Management Assistant Implementation Plan
*Preserved from chat ID: de5181c5-645a-49f5-9203-3d4c00f3bb79*

Add a powerful "AI Employee" chatbot that can answer questions about restaurant data and perform management actions (like updating prices).

## Safety & User Review
> [!IMPORTANT]
> The AI will have the ability to modify core restaurant data (prices, stock, etc.). We will implement this as "Assistant-suggested actions" that require a final confirmation from the user in the chat interface to ensure safety.

## Proposed Backend Changes

#### `server/services/ai.ts`
- **Refactor existing AI features** (Menu Parsing, Invoice Scanning, Forecasting) to use `invokeLLM` instead of the direct OpenAI SDK.
- Implement `chatWithAI` function using the built-in Manus Forge API (Gemini).
- Define a suite of tools mapping to `db.ts` functions:
    - `get_financial_summary`: Revenue, profit, COGS.
    - `get_inventory_status`: List low stock or specific item levels.
    - `update_menu_item_price`: Update a specific item's price.
    - `get_staff_on_shift`: Current clock-ins.
    - `create_draft_purchase_order`: Prepare a PO for review.

#### `server/routers.ts`
- Add a new `chat` mutation to the `ai` router.
- This mutation will handle the multi-turn conversation and tool execution loop.

## Proposed Frontend Changes

#### `client/src/components/DashboardLayout.tsx`
- Add a floating "AI Assistant" button in the bottom-right corner.
- Implement a slide-over or popover panel containing the `AIChatBox` component.

#### `client/src/components/AIChatBox.tsx`
- Enhance the UI to handle "Tool Result" messages (e.g., small cards showing "Price Updated Successfully").

## Verification Plan
1. Open the Chat Assistant.
2. Ask: "What was our revenue yesterday?" -> Verify AI returns correct figures.
3. Ask: "Change the price of 'Cheeseburger' to £12.50" -> Verify AI updates the price and waits for confirmation.
4. Ask: "Who is working right now?" -> Verify it lists clocked-in staff.
