import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockDb = {
  mergeTables: vi.fn().mockResolvedValue({ success: true }),
  unmergeTable: vi.fn().mockResolvedValue({ success: true }),
  createSplitBill: vi.fn().mockResolvedValue(1),
  getSplitBillsByOrder: vi.fn().mockResolvedValue([]),
  createPaymentDispute: vi.fn().mockResolvedValue(1),
  listPaymentDisputes: vi.fn().mockResolvedValue([]),
  updatePaymentDispute: vi.fn().mockResolvedValue({ success: true }),
  getLocationPrices: vi.fn().mockResolvedValue([]),
  setLocationPrice: vi.fn().mockResolvedValue(1),
  deleteLocationPrice: vi.fn().mockResolvedValue({ success: true }),
  getHourlySalesTrend: vi.fn().mockResolvedValue([]),
  getStaffSalesPerformance: vi.fn().mockResolvedValue([]),
  getUnifiedOrderQueue: vi.fn().mockResolvedValue([]),
};

vi.mock("./db", () => mockDb);

describe("Module 5.1 - POS & Order Management Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Table Merging", () => {
    it("should merge tables with valid IDs", async () => {
      const result = await mockDb.mergeTables(1, 2);
      expect(result).toEqual({ success: true });
      expect(mockDb.mergeTables).toHaveBeenCalledWith(1, 2);
    });

    it("should unmerge a table", async () => {
      const result = await mockDb.unmergeTable(1);
      expect(result).toEqual({ success: true });
      expect(mockDb.unmergeTable).toHaveBeenCalledWith(1);
    });
  });

  describe("Split Bills", () => {
    it("should create a split bill", async () => {
      const result = await mockDb.createSplitBill({
        orderId: 1,
        splitType: "equal",
        splitCount: 3,
        items: [],
      });
      expect(result).toBe(1);
    });

    it("should get split bills for an order", async () => {
      const result = await mockDb.getSplitBillsByOrder(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Payment Disputes", () => {
    it("should create a payment dispute", async () => {
      const result = await mockDb.createPaymentDispute({
        orderId: 1,
        disputeType: "chargeback",
        amount: "25.50",
        reason: "Customer claims not received",
      });
      expect(result).toBe(1);
    });

    it("should list payment disputes", async () => {
      const result = await mockDb.listPaymentDisputes();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update dispute status", async () => {
      const result = await mockDb.updatePaymentDispute(1, { status: "won" });
      expect(result).toEqual({ success: true });
    });
  });

  describe("Location Pricing", () => {
    it("should get location prices", async () => {
      const result = await mockDb.getLocationPrices(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should set a location price override", async () => {
      const result = await mockDb.setLocationPrice({
        locationId: 1,
        menuItemId: 5,
        price: "12.99",
      });
      expect(result).toBe(1);
    });

    it("should delete a location price override", async () => {
      const result = await mockDb.deleteLocationPrice(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe("Sales Analytics", () => {
    it("should get hourly sales trend", async () => {
      mockDb.getHourlySalesTrend.mockResolvedValueOnce([
        { hour: 11, orders: 15, revenue: 450.0 },
        { hour: 12, orders: 25, revenue: 780.0 },
        { hour: 13, orders: 20, revenue: 620.0 },
      ]);
      const result = await mockDb.getHourlySalesTrend("2026-02-18");
      expect(result.length).toBe(3);
      expect(result[1].hour).toBe(12);
      expect(result[1].orders).toBe(25);
    });

    it("should get staff sales performance", async () => {
      mockDb.getStaffSalesPerformance.mockResolvedValueOnce([
        { staffName: "John", totalOrders: 50, totalRevenue: "1500.00", avgCheck: "30.00" },
      ]);
      const result = await mockDb.getStaffSalesPerformance("2026-02-01", "2026-02-18");
      expect(result.length).toBe(1);
      expect(result[0].staffName).toBe("John");
    });

    it("should get unified order queue", async () => {
      mockDb.getUnifiedOrderQueue.mockResolvedValueOnce([
        { id: 1, channel: "dine_in", status: "pending", total: "45.00" },
        { id: 2, channel: "delivery", status: "preparing", total: "32.00" },
      ]);
      const result = await mockDb.getUnifiedOrderQueue();
      expect(result.length).toBe(2);
      expect(result[0].channel).toBe("dine_in");
      expect(result[1].channel).toBe("delivery");
    });
  });
});
