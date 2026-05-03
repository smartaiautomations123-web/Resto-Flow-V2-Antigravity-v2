import { getDb } from "../db";
import { unitConversions, supplierItems, marketPrices, ingredients } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export class ProcurementService {
  /**
   * Normalizes a quantity from one unit to another based on predefined rules or spreadsheet logic.
   * Implementation of the REGEXMATCH logic found in the Prisura spreadsheet.
   */
  static convertUnit(value: number, fromUnit: string, toUnit: string): number {
    const normalizedFrom = fromUnit.toUpperCase().trim();
    const normalizedTo = toUnit.toUpperCase().trim();

    if (normalizedFrom === normalizedTo) return value;

    // Weight Normalization (Base: LB)
    if (normalizedTo === 'LB' || normalizedTo === 'LBS' || normalizedTo === '#') {
      if (/^(OZ|OUNCE|OUNCES)$/.test(normalizedFrom)) return value / 16;
      if (/^(KG|KGS|KILOGRAM|KILOGRAMS)$/.test(normalizedFrom)) return value * 2.20462;
      if (/^(G|GRAM|GRAMS)$/.test(normalizedFrom)) return value / 453.592;
      if (/^(TON|TONS)$/.test(normalizedFrom)) return value * 2000;
      if (/^(GAL|GALLON|GALLONS)$/.test(normalizedFrom)) return value * 8.34; // Approx weight of water
    }

    // Volume Normalization (Base: GAL)
    if (normalizedTo === 'GAL' || normalizedTo === 'GALLON') {
      if (/^(QT|QUART|QUARTS)$/.test(normalizedFrom)) return value / 4;
      if (/^(PT|PINT|PINTS)$/.test(normalizedFrom)) return value / 8;
      if (/^(CUP|CUPS)$/.test(normalizedFrom)) return value / 16;
      if (/^(FOZ|FL OZ|FLUID OUNCE)$/.test(normalizedFrom)) return value / 128;
      if (/^(L|LTR|LITER|LITERS)$/.test(normalizedFrom)) return value * 0.264172;
    }

    // Count Normalization (Base: EA)
    if (normalizedTo === 'EA' || normalizedTo === 'EACH' || normalizedTo === 'CT') {
      if (/^(DZ|DOZEN)$/.test(normalizedFrom)) return value * 12;
      if (/^(CS|CASE)$/.test(normalizedFrom)) return value; // Usually handled by pack size
    }

    return value; // Fallback
  }

  /**
   * Calculates the true "Price per Base Unit" for a supplier item.
   */
  static calculateUnitPrice(packPrice: number, packSize: string, baseUom: string): number {
    // Regex to parse pack size like "2/1.5#", "12/1ct", "50 LB"
    const match = packSize.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(\w+)/) || 
                  packSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
    
    if (!match) return packPrice;

    let totalQuantity = 0;
    if (match.length === 4) {
      const pack = parseFloat(match[1]);
      const sizeQty = parseFloat(match[2]);
      const unit = match[3];
      totalQuantity = this.convertUnit(pack * sizeQty, unit, baseUom);
    } else {
      const sizeQty = parseFloat(match[1]);
      const unit = match[2];
      totalQuantity = this.convertUnit(sizeQty, unit, baseUom);
    }

    return totalQuantity > 0 ? packPrice / totalQuantity : packPrice;
  }

  /**
   * Records a new price point from the AI Scanner.
   */
  static async recordMarketPrice(supplierSku: string, supplierId: number, price: number, date: Date = new Date()) {
    const db = await getDb();
    if (!db) return null;

    // 1. Find the supplier item
    const [item] = await db.select()
      .from(supplierItems)
      .where(and(
        eq(supplierItems.supplierSku, supplierSku),
        eq(supplierItems.supplierId, supplierId)
      ));

    if (!item) return null;

    // 2. Insert into market_prices
    return await db.insert(marketPrices).values({
      supplierItemId: item.id,
      price: price.toString(),
      effectiveDate: date,
      source: 'AI_SCANNER'
    });
  }

  /**
   * Finds the best current price for an ingredient across all suppliers.
   */
  static async getBestPrice(ingredientId: number) {
    const db = await getDb();
    if (!db) return null;

    const items = await db.select({
      supplierName: sql`suppliers.name`,
      sku: supplierItems.supplierSku,
      packPrice: supplierItems.packPrice,
      packSize: supplierItems.packSize,
      baseUom: ingredients.baseUom,
    })
    .from(supplierItems)
    .innerJoin(ingredients, eq(supplierItems.ingredientId, ingredients.id))
    .innerJoin(sql`suppliers`, eq(supplierItems.supplierId, sql`suppliers.id`))
    .where(eq(supplierItems.ingredientId, ingredientId));

    const normalizedItems = items.map((item: any) => ({
      ...item,
      unitPrice: this.calculateUnitPrice(
        parseFloat(item.packPrice || '0'), 
        item.packSize || '1 EA', 
        item.baseUom || 'EA'
      )
    }));

    return normalizedItems.sort((a: any, b: any) => a.unitPrice - b.unitPrice)[0];
  }

  /**
   * Retrieves a consolidated list of all active ingredients and their current supplier prices.
   * Powers the "Single Shelf" dashboard.
   */
  static async getMarketPrices() {
    const db = await getDb();
    if (!db) return [];

    const rawItems = await db.select({
      ingredientId: ingredients.id,
      ingredientName: ingredients.name,
      baseUom: ingredients.baseUom,
      parLevel: ingredients.parLevel,
      currentStock: ingredients.currentStock,
      supplierId: sql`suppliers.id`,
      supplierName: sql`suppliers.name`,
      sku: supplierItems.supplierSku,
      packPrice: supplierItems.packPrice,
      packSize: supplierItems.packSize,
    })
    .from(ingredients)
    .leftJoin(supplierItems, eq(ingredients.id, supplierItems.ingredientId))
    .leftJoin(sql`suppliers`, eq(supplierItems.supplierId, sql`suppliers.id`))
    .where(eq(ingredients.isActive, true));

    // Group by ingredient
    const grouped = rawItems.reduce((acc: any, row: any) => {
      if (!acc[row.ingredientId]) {
        acc[row.ingredientId] = {
          id: row.ingredientId,
          name: row.ingredientName,
          baseUom: row.baseUom,
          parLevel: row.parLevel ? parseFloat(row.parLevel) : 0,
          currentStock: row.currentStock ? parseFloat(row.currentStock) : 0,
          suppliers: []
        };
      }
      
      if (row.supplierId) {
        acc[row.ingredientId].suppliers.push({
          supplierId: row.supplierId,
          supplierName: row.supplierName,
          sku: row.sku,
          packPrice: row.packPrice ? parseFloat(row.packPrice) : 0,
          packSize: row.packSize || '1 EA',
          unitPrice: this.calculateUnitPrice(
            row.packPrice ? parseFloat(row.packPrice) : 0,
            row.packSize || '1 EA',
            row.baseUom || 'EA'
          )
        });
      }
      return acc;
    }, {} as Record<number, any>);

    return Object.values(grouped).map((item: any) => {
      item.suppliers.sort((a: any, b: any) => a.unitPrice - b.unitPrice);
      item.bestPrice = item.suppliers[0] || null;
      return item;
    });
  }

  /**
   * Generates optimal purchase orders based on par levels and best market prices.
   */
  static async generateSmartBasket() {
    const marketData = await this.getMarketPrices();
    const basket: Record<number, any> = {};

    for (const item of marketData) {
      if (item.currentStock < item.parLevel && item.bestPrice) {
        const orderQty = item.parLevel - item.currentStock;
        const supplierId = item.bestPrice.supplierId;

        if (!basket[supplierId]) {
          basket[supplierId] = {
            supplierId,
            supplierName: item.bestPrice.supplierName,
            items: [],
            totalCost: 0
          };
        }

        const cost = orderQty * item.bestPrice.unitPrice;
        basket[supplierId].items.push({
          ingredientId: item.id,
          name: item.name,
          orderQty,
          unitPrice: item.bestPrice.unitPrice,
          totalCost: cost
        });
        basket[supplierId].totalCost += cost;
      }
    }

    return Object.values(basket);
  }
}
