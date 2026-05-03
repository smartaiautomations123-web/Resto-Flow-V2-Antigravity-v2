import "dotenv/config";
import * as db from "../server/db.js";

async function run() {
    console.log("Starting mock data seed...");

    const ingredients = await db.listIngredients();
    console.log(`Found ${ingredients.length} ingredients.`);

    // Just force the first 3 to be low stock so the LLM has something to warn about
    for (const item of ingredients.slice(0, 3)) {
        const min = Number(item.minStock || 10) === 0 ? 10 : Number(item.minStock || 10);
        const lowAmount = Math.max(0, min - 5);
        await db.updateIngredient(item.id, {
            currentStock: String(lowAmount),
        });
        console.log(`📉 Set ${item.name} to low stock (Current: ${lowAmount}, Min: ${min})`);
    }

    console.log("Creating mock orders for the last 7 days...");
    // Create a fake order to populate top items
    const menuItems = await db.listMenuItems();
    if (menuItems && menuItems.length > 0) {
        // Create a completed order
        const orderInsert = await db.createOrder({
            tableId: 1,
            customerName: "Walk-in Customer",
            type: "dine_in",
            status: "completed",
            orderNumber: "MOCK-" + Math.floor(Math.random() * 10000)
        });
        const orderId = (orderInsert as any)[0].insertId;

        let total = 0;
        for (const mItem of menuItems.slice(0, 3)) {
            const qty = Math.floor(Math.random() * 5) + 2;
            const sub = qty * Number(mItem.price);
            total += sub;
            await db.addOrderItem({
                orderId,
                menuItemId: mItem.id,
                name: mItem.name,
                quantity: String(qty),
                unitPrice: String(mItem.price),
                totalPrice: String(sub),
                notes: ""
            });
        }
        await db.updateOrder(orderId, { total: String(total) });
        console.log(`🛒 Created mock order #${orderId} with 3 top-selling items.`);
    }

    console.log("✅ Mock data seeded. The AI should now pick this up in the dashboard!");
    process.exit(0);
}

run().catch(e => {
    console.error("Error seeding:", e);
    process.exit(1);
});
