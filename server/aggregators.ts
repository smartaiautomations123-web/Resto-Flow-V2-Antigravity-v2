/**
 * Third-Party Aggregator Integration Framework
 * Supports Uber Eats, DoorDash, Deliveroo, and other platforms
 */

import { getDb } from './db';
import { orders, orderItems } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface AggregatorOrder {
  externalId: string;
  platform: 'uber_eats' | 'doordash' | 'deliveroo' | 'other';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialRequests?: string;
  }>;
  totalAmount: number;
  deliveryFee?: number;
  platformFee?: number;
  notes?: string;
  scheduledTime?: Date;
}

export interface AggregatorConfig {
  platform: 'uber_eats' | 'doordash' | 'deliveroo';
  apiKey: string;
  restaurantId: string;
  webhookSecret: string;
  isActive: boolean;
}

/**
 * Uber Eats Integration
 */
export class UberEatsIntegration {
  private config: AggregatorConfig;

  constructor(config: AggregatorConfig) {
    this.config = config;
  }

  /**
   * Fetch orders from Uber Eats API
   */
  async fetchOrders(): Promise<AggregatorOrder[]> {
    try {
      const response = await fetch(
        `https://api.uber.com/v2/eats/orders?restaurant_id=${this.config.restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Uber Eats API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformOrders(data.orders || []);
    } catch (error) {
      console.error('Uber Eats fetch error:', error);
      return [];
    }
  }

  /**
   * Transform Uber Eats order format to internal format
   */
  private transformOrders(uberOrders: any[]): AggregatorOrder[] {
    return uberOrders.map((order) => ({
      externalId: order.id,
      platform: 'uber_eats' as const,
      customerName: order.eater.name,
      customerPhone: order.eater.phone_number,
      customerEmail: order.eater.email,
      deliveryAddress: order.delivery_address?.address,
      items: order.items.map((item: any) => ({
        name: item.title,
        quantity: item.quantity,
        price: item.price / 100, // Convert cents to dollars
        specialRequests: item.special_instructions,
      })),
      totalAmount: order.total_amount / 100,
      deliveryFee: order.delivery_fee / 100,
      platformFee: order.service_fee / 100,
      notes: order.special_instructions,
      scheduledTime: order.scheduled_pickup_time
        ? new Date(order.scheduled_pickup_time)
        : undefined,
    }));
  }

  /**
   * Mark order as accepted in Uber Eats
   */
  async acceptOrder(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.uber.com/v2/eats/orders/${externalId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Uber Eats accept error:', error);
      return false;
    }
  }

  /**
   * Mark order as ready in Uber Eats
   */
  async markReady(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.uber.com/v2/eats/orders/${externalId}/ready`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Uber Eats ready error:', error);
      return false;
    }
  }
}

/**
 * DoorDash Integration
 */
export class DoorDashIntegration {
  private config: AggregatorConfig;

  constructor(config: AggregatorConfig) {
    this.config = config;
  }

  /**
   * Fetch orders from DoorDash API
   */
  async fetchOrders(): Promise<AggregatorOrder[]> {
    try {
      const response = await fetch(
        `https://api.doordash.com/v2/orders?merchant_id=${this.config.restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`DoorDash API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformOrders(data.results || []);
    } catch (error) {
      console.error('DoorDash fetch error:', error);
      return [];
    }
  }

  /**
   * Transform DoorDash order format to internal format
   */
  private transformOrders(ddOrders: any[]): AggregatorOrder[] {
    return ddOrders.map((order) => ({
      externalId: order.id,
      platform: 'doordash' as const,
      customerName: order.consumer.name,
      customerPhone: order.consumer.phone_number,
      customerEmail: order.consumer.email,
      deliveryAddress: order.delivery_address,
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        specialRequests: item.special_instructions,
      })),
      totalAmount: order.subtotal + order.delivery_fee + order.service_fee,
      deliveryFee: order.delivery_fee,
      platformFee: order.service_fee,
      notes: order.special_instructions,
      scheduledTime: order.scheduled_time
        ? new Date(order.scheduled_time)
        : undefined,
    }));
  }

  /**
   * Accept order on DoorDash
   */
  async acceptOrder(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.doordash.com/v2/orders/${externalId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('DoorDash accept error:', error);
      return false;
    }
  }

  /**
   * Mark order as ready on DoorDash
   */
  async markReady(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.doordash.com/v2/orders/${externalId}/ready`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('DoorDash ready error:', error);
      return false;
    }
  }
}

/**
 * Deliveroo Integration
 */
export class DeliverooIntegration {
  private config: AggregatorConfig;

  constructor(config: AggregatorConfig) {
    this.config = config;
  }

  /**
   * Fetch orders from Deliveroo API
   */
  async fetchOrders(): Promise<AggregatorOrder[]> {
    try {
      const response = await fetch(
        `https://api.deliveroo.com/v2/orders?restaurant_id=${this.config.restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Deliveroo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformOrders(data.orders || []);
    } catch (error) {
      console.error('Deliveroo fetch error:', error);
      return [];
    }
  }

  /**
   * Transform Deliveroo order format to internal format
   */
  private transformOrders(drOrders: any[]): AggregatorOrder[] {
    return drOrders.map((order) => ({
      externalId: order.id,
      platform: 'deliveroo' as const,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      customerEmail: order.customer.email,
      deliveryAddress: order.delivery_address?.full_address,
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        specialRequests: item.instructions,
      })),
      totalAmount: order.total,
      deliveryFee: order.delivery_fee,
      platformFee: order.commission,
      notes: order.special_instructions,
      scheduledTime: order.scheduled_time
        ? new Date(order.scheduled_time)
        : undefined,
    }));
  }

  /**
   * Accept order on Deliveroo
   */
  async acceptOrder(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.deliveroo.com/v2/orders/${externalId}/accept`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Deliveroo accept error:', error);
      return false;
    }
  }

  /**
   * Mark order as ready on Deliveroo
   */
  async markReady(externalId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.deliveroo.com/v2/orders/${externalId}/ready`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Deliveroo ready error:', error);
      return false;
    }
  }
}

/**
 * Convert aggregator order to internal order
 */
export async function convertAggregatorOrder(
  aggOrder: AggregatorOrder,
  locationId: number
): Promise<{ orderId: number }> {
  const db = await getDb() as any;

  // Generate a unique order number: platform prefix + timestamp + last 6 of externalId
  const platformPrefix = aggOrder.platform.toUpperCase().slice(0, 2); // UB, DO, DE
  const externalSuffix = aggOrder.externalId.slice(-6).toUpperCase();
  const orderNumber = `${platformPrefix}-${Date.now()}-${externalSuffix}`;

  // Create order
  const result = await db
    .insert(orders)
    .values({
      locationId,
      orderNumber,
      customerId: null, // Will be created as guest customer
      tableId: null,    // Delivery order, no table
      type: 'delivery',
      status: 'pending',
      subtotal: aggOrder.totalAmount.toString(),
      taxAmount: '0',
      discountAmount: '0',
      total: aggOrder.totalAmount.toString(),
      paymentMethod: 'online',
      externalOrderId: aggOrder.externalId,
      externalPlatform: aggOrder.platform,
      notes: aggOrder.notes,
      createdAt: new Date(),
      createdBy: 'system',
    })
    .execute();

  const orderId = (result as any).insertId;

  // Add items — attempt name-based lookup against internal menu items
  for (const item of aggOrder.items) {
    // Best-effort match: find a menu item whose name contains the aggregator item name (case-insensitive)
    let resolvedMenuItemId = 0; // 0 = unmatched sentinel; flagged for manual review
    try {
      const [match] = await db.execute(
        `SELECT id FROM menu_items WHERE LOWER(name) LIKE ? LIMIT 1`,
        [`%${item.name.toLowerCase()}%`]
      );
      if (match && (match as any).length > 0) {
        resolvedMenuItemId = (match as any)[0].id;
      }
    } catch {
      // Non-fatal — item will be saved as unmatched for manual review
      console.warn(`[Aggregator] Could not resolve menuItemId for: "${item.name}"`);
    }

    await db
      .insert(orderItems)
      .values({
        orderId,
        menuItemId: resolvedMenuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.price * item.quantity).toString(),
        status: 'pending',
        notes: resolvedMenuItemId === 0 ? '[UNMATCHED - needs manual review]' : undefined,
      })
      .execute();
  }

  return { orderId };
}
