/**
 * tRPC Routers for Third-Party Aggregator Integration
 */

import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import {
  UberEatsIntegration,
  DoorDashIntegration,
  DeliverooIntegration,
  convertAggregatorOrder,
  type AggregatorConfig,
} from './aggregators';

export const aggregatorRouter = router({
  /**
   * Configure aggregator integration
   */
  configureAggregator: protectedProcedure
    .input(
      z.object({
        platform: z.enum(['uber_eats', 'doordash', 'deliveroo']),
        apiKey: z.string(),
        restaurantId: z.string(),
        webhookSecret: z.string(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, store config in database encrypted
      // For now, return success
      return {
        success: true,
        platform: input.platform,
        message: `${input.platform} integration configured`,
      };
    }),

  /**
   * Fetch orders from all active aggregators
   */
  fetchAggregatorOrders: protectedProcedure
    .input(
      z.object({
        locationId: z.number(),
        platforms: z
          .enum(['uber_eats', 'doordash', 'deliveroo'])
          .array()
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const allOrders: any[] = [];

      // Fetch from each configured platform
      // In production, retrieve configs from database
      const configs: AggregatorConfig[] = [];

      for (const config of configs) {
        if (input.platforms && !input.platforms.includes(config.platform)) {
          continue;
        }

        try {
          let integration;
          switch (config.platform) {
            case 'uber_eats':
              integration = new UberEatsIntegration(config);
              break;
            case 'doordash':
              integration = new DoorDashIntegration(config);
              break;
            case 'deliveroo':
              integration = new DeliverooIntegration(config);
              break;
          }

          if (integration) {
            const orders = await integration.fetchOrders();
            allOrders.push(
              ...orders.map((o) => ({
                ...o,
                locationId: input.locationId,
              }))
            );
          }
        } catch (error) {
          console.error(`Error fetching from ${config.platform}:`, error);
        }
      }

      return {
        orders: allOrders,
        total: allOrders.length,
        platforms: Array.from(new Set(allOrders.map((o) => o.platform))),
      };
    }),

  /**
   * Accept aggregator order and create internal order
   */
  acceptAggregatorOrder: protectedProcedure
    .input(
      z.object({
        externalId: z.string(),
        platform: z.enum(['uber_eats', 'doordash', 'deliveroo']),
        locationId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get integration for platform
        let integration;
        const config: AggregatorConfig = {
          platform: input.platform,
          apiKey: '', // Retrieve from config
          restaurantId: '',
          webhookSecret: '',
          isActive: true,
        };

        switch (input.platform) {
          case 'uber_eats':
            integration = new UberEatsIntegration(config);
            break;
          case 'doordash':
            integration = new DoorDashIntegration(config);
            break;
          case 'deliveroo':
            integration = new DeliverooIntegration(config);
            break;
        }

        if (!integration) {
          throw new Error('Invalid platform');
        }

        // Accept on aggregator platform
        const accepted = await integration.acceptOrder(input.externalId);

        if (!accepted) {
          throw new Error('Failed to accept order on aggregator platform');
        }

        return {
          success: true,
          externalId: input.externalId,
          platform: input.platform,
          message: 'Order accepted',
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    }),

  /**
   * Mark aggregator order as ready for pickup
   */
  markAggregatorOrderReady: protectedProcedure
    .input(
      z.object({
        externalId: z.string(),
        platform: z.enum(['uber_eats', 'doordash', 'deliveroo']),
        orderId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let integration;
        const config: AggregatorConfig = {
          platform: input.platform,
          apiKey: '',
          restaurantId: '',
          webhookSecret: '',
          isActive: true,
        };

        switch (input.platform) {
          case 'uber_eats':
            integration = new UberEatsIntegration(config);
            break;
          case 'doordash':
            integration = new DoorDashIntegration(config);
            break;
          case 'deliveroo':
            integration = new DeliverooIntegration(config);
            break;
        }

        if (!integration) {
          throw new Error('Invalid platform');
        }

        // Mark as ready on aggregator platform
        const ready = await integration.markReady(input.externalId);

        if (!ready) {
          throw new Error('Failed to mark order as ready on platform');
        }

        return {
          success: true,
          orderId: input.orderId,
          externalId: input.externalId,
          message: 'Order marked as ready',
        };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    }),

  /**
   * Get aggregator order status
   */
  getAggregatorOrderStatus: publicProcedure
    .input(
      z.object({
        externalId: z.string(),
        platform: z.enum(['uber_eats', 'doordash', 'deliveroo']),
      })
    )
    .query(async ({ input }) => {
      // In production, fetch actual status from aggregator API
      return {
        externalId: input.externalId,
        platform: input.platform,
        status: 'pending',
        message: 'Order status retrieved',
      };
    }),

  /**
   * Webhook handler for aggregator order updates
   */
  handleAggregatorWebhook: publicProcedure
    .input(
      z.object({
        platform: z.enum(['uber_eats', 'doordash', 'deliveroo']),
        event: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      // Verify webhook signature
      // Process event (order created, cancelled, etc.)
      // Update internal order status

      return {
        success: true,
        platform: input.platform,
        event: input.event,
        message: 'Webhook processed',
      };
    }),
});
