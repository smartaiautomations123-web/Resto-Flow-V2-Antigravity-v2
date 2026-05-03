import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-owner",
    email: "owner@restaurant.com",
    name: "Test Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => { },
    } as TrpcContext["res"],
  };

  return { ctx };
}

// Mock the db module
vi.mock("./db", () => {
  let staffStore: any[] = [];
  let staffIdCounter = 1;
  let categoryStore: any[] = [];
  let catIdCounter = 1;
  let menuStore: any[] = [];
  let menuIdCounter = 1;
  let ingredientStore: any[] = [];
  let ingIdCounter = 1;
  let tableStore: any[] = [];
  let tableIdCounter = 1;
  let orderStore: any[] = [];
  let orderIdCounter = 1;
  let orderItemStore: any[] = [];
  let orderItemIdCounter = 1;
  let supplierStore: any[] = [];
  let supplierIdCounter = 1;
  let customerStore: any[] = [];
  let customerIdCounter = 1;
  let timeEntryStore: any[] = [];
  let timeEntryIdCounter = 1;
  let shiftStore: any[] = [];
  let shiftIdCounter = 1;
  let reservationStore: any[] = [];
  let reservationIdCounter = 1;
  let poStore: any[] = [];
  let poIdCounter = 1;

  return {
    // Staff
    listStaff: vi.fn(() => staffStore),
    getStaffById: vi.fn((id: number) => staffStore.find(s => s.id === id)),
    createStaff: vi.fn((data: any) => {
      const s = { id: staffIdCounter++, ...data, isActive: true, createdAt: new Date(), updatedAt: new Date() };
      staffStore.push(s);
      return s;
    }),
    updateStaff: vi.fn((id: number, data: any) => {
      const idx = staffStore.findIndex(s => s.id === id);
      if (idx >= 0) staffStore[idx] = { ...staffStore[idx], ...data };
      return staffStore[idx];
    }),
    deleteStaff: vi.fn((id: number) => { staffStore = staffStore.filter(s => s.id !== id); }),
    clockIn: vi.fn((staffId: number, status?: string) => {
      const entry = { id: timeEntryIdCounter++, staffId, clockIn: new Date(), clockOut: null, notes: status };
      timeEntryStore.push(entry);
      return entry;
    }),
    getMainLocation: vi.fn(() => ({ id: 1, name: "Main", latitude: 40.7128, longitude: -74.0060 })),
    clockOut: vi.fn((id: number) => {
      const entry = timeEntryStore.find(e => e.id === id);
      if (entry) entry.clockOut = new Date();
      return entry;
    }),
    getActiveClockEntry: vi.fn((staffId: number) => timeEntryStore.find(e => e.staffId === staffId && !e.clockOut)),
    listTimeEntries: vi.fn(() => timeEntryStore),

    // Shifts
    listShifts: vi.fn(() => shiftStore),
    createShift: vi.fn((data: any) => {
      const s = { id: shiftIdCounter++, ...data, createdAt: new Date() };
      shiftStore.push(s);
      return s;
    }),
    deleteShift: vi.fn((id: number) => { shiftStore = shiftStore.filter(s => s.id !== id); }),

    // Categories (using the names the router calls)
    listMenuCategories: vi.fn(() => categoryStore),
    createMenuCategory: vi.fn((data: any) => {
      const c = { id: catIdCounter++, ...data, isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() };
      categoryStore.push(c);
      return c;
    }),
    updateMenuCategory: vi.fn((id: number, data: any) => {
      const idx = categoryStore.findIndex(c => c.id === id);
      if (idx >= 0) categoryStore[idx] = { ...categoryStore[idx], ...data };
      return categoryStore[idx];
    }),
    deleteMenuCategory: vi.fn((id: number) => { categoryStore = categoryStore.filter(c => c.id !== id); }),

    // Menu
    listMenuItems: vi.fn(() => menuStore),
    getMenuItemById: vi.fn((id: number) => menuStore.find(m => m.id === id)),
    createMenuItem: vi.fn((data: any) => {
      const m = { id: menuIdCounter++, ...data, isAvailable: true, isPopular: false, createdAt: new Date(), updatedAt: new Date() };
      menuStore.push(m);
      return m;
    }),
    updateMenuItem: vi.fn((id: number, data: any) => {
      const idx = menuStore.findIndex(m => m.id === id);
      if (idx >= 0) menuStore[idx] = { ...menuStore[idx], ...data };
      return menuStore[idx];
    }),
    deleteMenuItem: vi.fn((id: number) => { menuStore = menuStore.filter(m => m.id !== id); }),

    // Ingredients
    listIngredients: vi.fn(() => ingredientStore),
    getLowStockIngredients: vi.fn(() => ingredientStore.filter(i => Number(i.currentStock) < Number(i.minStock))),
    createIngredient: vi.fn((data: any) => {
      const i = { id: ingIdCounter++, ...data, currentStock: data.currentStock || "0", minStock: data.minStock || "0", costPerUnit: data.costPerUnit || "0", createdAt: new Date(), updatedAt: new Date() };
      ingredientStore.push(i);
      return i;
    }),
    updateIngredient: vi.fn((id: number, data: any) => {
      const idx = ingredientStore.findIndex(i => i.id === id);
      if (idx >= 0) ingredientStore[idx] = { ...ingredientStore[idx], ...data };
      return ingredientStore[idx];
    }),
    deleteIngredient: vi.fn((id: number) => { ingredientStore = ingredientStore.filter(i => i.id !== id); }),

    // Tables
    listTables: vi.fn(() => tableStore),
    createTable: vi.fn((data: any) => {
      const t = { id: tableIdCounter++, ...data, status: "free", createdAt: new Date(), updatedAt: new Date() };
      tableStore.push(t);
      return t;
    }),
    updateTable: vi.fn((id: number, data: any) => {
      const idx = tableStore.findIndex(t => t.id === id);
      if (idx >= 0) tableStore[idx] = { ...tableStore[idx], ...data };
      return tableStore[idx];
    }),
    deleteTable: vi.fn((id: number) => { tableStore = tableStore.filter(t => t.id !== id); }),

    // Orders
    listOrders: vi.fn(() => orderStore),
    getOrderById: vi.fn((id: number) => orderStore.find(o => o.id === id)),
    createOrder: vi.fn((data: any) => {
      const o = { id: orderIdCounter++, orderNumber: `ORD-${Date.now()}`, ...data, status: "pending", paymentStatus: "unpaid", subtotal: "0", taxAmount: "0", discountAmount: "0", serviceCharge: "0", tipAmount: "0", total: "0", createdAt: new Date(), updatedAt: new Date() };
      orderStore.push(o);
      return o;
    }),
    updateOrder: vi.fn((id: number, data: any) => {
      const idx = orderStore.findIndex(o => o.id === id);
      if (idx >= 0) orderStore[idx] = { ...orderStore[idx], ...data };
      return orderStore[idx];
    }),

    // Order Items (using names the router calls)
    addOrderItem: vi.fn((data: any) => {
      const item = { id: orderItemIdCounter++, ...data, status: "pending", createdAt: new Date() };
      orderItemStore.push(item);
      return item;
    }),
    getOrderItems: vi.fn((orderId: number) => orderItemStore.filter(i => i.orderId === orderId)),
    updateOrderItem: vi.fn((id: number, data: any) => {
      const idx = orderItemStore.findIndex(i => i.id === id);
      if (idx >= 0) orderItemStore[idx] = { ...orderItemStore[idx], ...data, sentToKitchenAt: data.status === "preparing" ? new Date() : orderItemStore[idx].sentToKitchenAt };
      return orderItemStore[idx];
    }),

    // KDS - router calls getOrdersByStatus for kds.items
    getOrdersByStatus: vi.fn((status: string) => orderItemStore.filter(i => ["pending", "preparing"].includes(i.status))),

    // Suppliers
    listSuppliers: vi.fn(() => supplierStore),
    createSupplier: vi.fn((data: any) => {
      const s = { id: supplierIdCounter++, ...data, createdAt: new Date(), updatedAt: new Date() };
      supplierStore.push(s);
      return s;
    }),
    updateSupplier: vi.fn((id: number, data: any) => {
      const idx = supplierStore.findIndex(s => s.id === id);
      if (idx >= 0) supplierStore[idx] = { ...supplierStore[idx], ...data };
      return supplierStore[idx];
    }),
    deleteSupplier: vi.fn((id: number) => { supplierStore = supplierStore.filter(s => s.id !== id); }),

    // Purchase Orders
    listPurchaseOrders: vi.fn(() => poStore),
    createPurchaseOrder: vi.fn((data: any) => {
      const po = { id: poIdCounter++, ...data, status: "draft", totalAmount: "0", createdAt: new Date(), updatedAt: new Date() };
      poStore.push(po);
      return po;
    }),
    updatePurchaseOrder: vi.fn((id: number, data: any) => {
      const idx = poStore.findIndex(p => p.id === id);
      if (idx >= 0) poStore[idx] = { ...poStore[idx], ...data };
      return poStore[idx];
    }),

    // Customers
    listCustomers: vi.fn(() => customerStore),
    getCustomerById: vi.fn((id: number) => customerStore.find(c => c.id === id)),
    createCustomer: vi.fn((data: any) => {
      const c = { id: customerIdCounter++, ...data, loyaltyPoints: 0, totalSpent: "0", visitCount: 0, createdAt: new Date(), updatedAt: new Date() };
      customerStore.push(c);
      return c;
    }),
    updateCustomer: vi.fn((id: number, data: any) => {
      const idx = customerStore.findIndex(c => c.id === id);
      if (idx >= 0) customerStore[idx] = { ...customerStore[idx], ...data };
      return customerStore[idx];
    }),
    addLoyaltyPoints: vi.fn((id: number, points: number) => {
      const idx = customerStore.findIndex(c => c.id === id);
      if (idx >= 0) customerStore[idx].loyaltyPoints += points;
      return customerStore[idx];
    }),

    // Reservations
    listReservations: vi.fn(() => reservationStore),
    createReservation: vi.fn((data: any) => {
      const r = { id: reservationIdCounter++, ...data, status: "confirmed", createdAt: new Date(), updatedAt: new Date() };
      reservationStore.push(r);
      return r;
    }),
    updateReservation: vi.fn((id: number, data: any) => {
      const idx = reservationStore.findIndex(r => r.id === id);
      if (idx >= 0) reservationStore[idx] = { ...reservationStore[idx], ...data };
      return reservationStore[idx];
    }),

    // Reports - names matching what the router calls
    getProfitabilitySummary: vi.fn(() => ({ totalRevenue: "1500.00", totalOrders: 25, avgTicket: "60.00" })),
    getDailyProfitTrend: vi.fn(() => [{ date: "2026-02-15", revenue: "500.00", orders: 10 }]),
    getTopProfitableItems: vi.fn(() => [{ name: "Burger", totalQty: 50, totalRevenue: "500.00" }]),
    getProfitabilityByCategory: vi.fn(() => [{ categoryName: "Mains", totalSales: "1000.00" }]),
    calculateTimesheetSummary: vi.fn(() => [{ staffName: "John", totalHours: "40", hourlyRate: "15.00" }]),
  };
});

describe("Staff Management", () => {
  it("creates a staff member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const staff = await caller.staff.create({
      name: "John Doe",
      role: "server",
      hourlyRate: "15.00",
    });
    expect(staff).toBeDefined();
    expect(staff.name).toBe("John Doe");
    expect(staff.role).toBe("server");
  });

  it("lists staff members", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.staff.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("clocks in a staff member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const entry = await caller.staff.clockIn({ staffId: 1, latitude: 40.7128, longitude: -74.0060 });
    expect(entry).toBeDefined();
    expect(entry.staffId).toBe(1);
    expect(entry.clockIn).toBeDefined();
  });
});

describe("Menu Management", () => {
  it("creates a category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const cat = await caller.categories.create({ name: "Appetizers", description: "Starters" });
    expect(cat).toBeDefined();
    expect(cat.name).toBe("Appetizers");
  });

  it("creates a menu item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const item = await caller.menu.create({
      name: "Caesar Salad",
      price: "12.99",
      categoryId: 1,
      station: "salad",
    });
    expect(item).toBeDefined();
    expect(item.name).toBe("Caesar Salad");
  });

  it("lists menu items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.menu.list();
    expect(Array.isArray(items)).toBe(true);
  });
});

describe("Order Flow", () => {
  it("creates an order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const order = await caller.orders.create({
      type: "dine_in",
      customerName: "Test Customer",
    });
    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending");
  });

  it("adds items to an order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const item = await caller.orders.addItem({
      orderId: 1,
      menuItemId: 1,
      name: "Caesar Salad",
      quantity: 2,
      unitPrice: "12.99",
      totalPrice: "25.98",
    });
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
  });

  it("updates order status and payment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const updated = await caller.orders.update({
      id: 1,
      status: "preparing",
      paymentMethod: "card",
      paymentStatus: "paid",
      total: "25.98",
    });
    expect(updated).toBeDefined();
  });
});

describe("KDS (Kitchen Display)", () => {
  it("fetches KDS items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.kds.items();
    expect(Array.isArray(items)).toBe(true);
  });

  it("updates KDS item status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const updated = await caller.kds.updateStatus({ id: 1, status: "preparing" });
    expect(updated).toBeDefined();
  });
});

describe("Inventory", () => {
  it("creates an ingredient", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const ing = await caller.ingredients.create({
      name: "Flour",
      unit: "kg",
      currentStock: "50",
      minStock: "10",
      costPerUnit: "1.50",
    });
    expect(ing).toBeDefined();
    expect(ing.name).toBe("Flour");
  });

  it("detects low stock", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const lowStock = await caller.ingredients.lowStock();
    expect(Array.isArray(lowStock)).toBe(true);
  });
});

describe("Suppliers", () => {
  it("creates a supplier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const supplier = await caller.suppliers.create({
      name: "Fresh Foods Inc",
      email: "info@freshfoods.com",
    });
    expect(supplier).toBeDefined();
    expect(supplier.name).toBe("Fresh Foods Inc");
  });

  it("lists suppliers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.suppliers.list();
    expect(Array.isArray(list)).toBe(true);
  });
});

describe("Customers & Loyalty", () => {
  it("creates a customer", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const customer = await caller.customers.create({
      name: "Jane Smith",
      email: "jane@example.com",
    });
    expect(customer).toBeDefined();
    expect(customer.name).toBe("Jane Smith");
    expect(customer.loyaltyPoints).toBe(0);
  });

  it("adds loyalty points", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const updated = await caller.customers.addPoints({ customerId: 1, points: 100 });
    expect(updated).toBeDefined();
  });
});

describe("Tables", () => {
  it("creates a table", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const table = await caller.tables.create({
      name: "Table 1",
      seats: 4,
      section: "main",
    });
    expect(table).toBeDefined();
    expect(table.name).toBe("Table 1");
    expect(table.status).toBe("free");
  });

  it("updates table status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const updated = await caller.tables.update({ id: 1, status: "occupied" });
    expect(updated).toBeDefined();
  });
});

describe("Reservations", () => {
  it("creates a reservation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const res = await caller.reservations.create({
      guestName: "Bob Wilson",
      date: "2026-02-20",
      time: "19:00",
      partySize: 4,
    });
    expect(res).toBeDefined();
    expect(res.status).toBe("confirmed");
  });
});

describe("Reports", () => {
  it("fetches sales stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.reports.salesStats({ dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    expect(stats).toBeDefined();
    expect(stats.totalRevenue).toBeDefined();
    expect(stats.totalOrders).toBeDefined();
  });

  it("fetches top items", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const items = await caller.reports.topItems({ dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    expect(Array.isArray(items)).toBe(true);
  });

  it("fetches daily sales", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const sales = await caller.reports.dailySales({ dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    expect(Array.isArray(sales)).toBe(true);
  });

  it("fetches labour costs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const costs = await caller.reports.labourCosts({ dateFrom: "2026-02-01", dateTo: "2026-02-28" });
    expect(Array.isArray(costs)).toBe(true);
  });
});

describe("Shifts", () => {
  it("creates a shift", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const shift = await caller.shifts.create({
      staffId: 1,
      date: "2026-02-16",
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(shift).toBeDefined();
    expect(shift.staffId).toBe(1);
  });
});
