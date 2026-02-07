/**
 * Orders Router
 * 
 * Handles order creation, retrieval, status updates, and cancellations.
 * All order operations require authentication.
 */

import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createOrder,
  addOrderItem,
  getOrderById,
  getOrderItems,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  createShipment,
  getShipmentByOrderId,
  updateShipment,
} from "../db";
import { getProductById } from "../db";
import { nanoid } from "nanoid";

/**
 * Generate unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export const ordersRouter = router({
  /**
   * Create a new order
   * 
   * Input: array of items with productId and quantity
   * Returns: order ID and order number
   */
  create: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive().max(999),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.items || input.items.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order must contain at least one item",
          });
        }

        // Validate all products exist and calculate total
        let totalAmount = 0;
        const validatedItems: Array<{
          productId: number;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }> = [];

        for (const item of input.items) {
          const product = await getProductById(item.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Product ${item.productId} not found`,
            });
          }

          if (!product.stock || product.stock < item.quantity) {
            throw new TRPCError({
              code: "CONFLICT",
              message: `Insufficient stock for product ${product.name}`,
            });
          }

          const itemTotal = product.price * item.quantity;
          totalAmount += itemTotal;

          validatedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
          });
        }

        // Create order
        const orderNumber = generateOrderNumber();
        const orderId = await createOrder(ctx.user.id, totalAmount, orderNumber);

        if (!orderId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order",
          });
        }

        // Add order items
        for (const item of validatedItems) {
          await addOrderItem(
            orderId,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          );
        }

        return {
          orderId,
          orderNumber,
          totalAmount,
          itemCount: validatedItems.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error creating order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  /**
   * Get order by ID
   * 
   * Returns: order details with items
   */
  getById: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ ctx, input: orderId }) => {
      try {
        const order = await getOrderById(orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Check authorization: user can only view their own orders
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this order",
          });
        }

        const items = await getOrderItems(orderId);

        return {
          ...order,
          items: items.map((item) => ({
            id: item.orderItem.id,
            productId: item.orderItem.productId,
            productName: item.product?.name || "Unknown Product",
            quantity: item.orderItem.quantity,
            unitPrice: item.orderItem.unitPrice,
            totalPrice: item.orderItem.totalPrice,
          })),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error fetching order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order",
        });
      }
    }),

  /**
   * Get user's orders with pagination
   * 
   * Returns: array of orders
   */
  getUserOrders: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 20;
        const offset = (page - 1) * limit;

        const userOrders = await getUserOrders(ctx.user.id, limit, offset);

        return {
          orders: userOrders,
          page,
          limit,
          total: userOrders.length,
        };
      } catch (error) {
        console.error("[Orders] Error fetching user orders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      }
    }),

  /**
   * Update order status (admin only)
   * 
   * Allowed transitions:
   * - pending → paid
   * - pending → cancelled
   * - paid → shipped (handled by shipment system)
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        status: z.enum(["pending", "paid", "failed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Validate status transition
        const validTransitions: Record<string, string[]> = {
          pending: ["paid", "failed", "cancelled"],
          paid: ["cancelled"],
          failed: ["pending"],
          cancelled: [],
        };

        const allowedStatuses = validTransitions[order.status as keyof typeof validTransitions];
        if (!allowedStatuses || !allowedStatuses.includes(input.status)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot transition from ${order.status} to ${input.status}`,
          });
        }

        const success = await updateOrderStatus(input.orderId, input.status as any);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update order status",
          });
        }

        return { success: true, newStatus: input.status };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error updating order status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        });
      }
    }),

  /**
   * Cancel order
   * 
   * Only pending orders can be cancelled
   */
  cancel: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ ctx, input: orderId }) => {
      try {
        const order = await getOrderById(orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Check authorization
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to cancel this order",
          });
        }

        // Only pending orders can be cancelled
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Cannot cancel order with status: ${order.status}`,
          });
        }

        const success = await cancelOrder(orderId);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to cancel order",
          });
        }

        return { success: true, message: "Order cancelled successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error cancelling order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel order",
        });
      }
    }),

  /**
   * Create or update shipment information for an order
   */
  createShipment: protectedProcedure
    .input(
      z.object({
        orderId: z.number().int().positive(),
        recipientName: z.string().min(1, "Recipient name is required"),
        recipientPhone: z.string().min(1, "Phone number is required"),
        address: z.string().min(1, "Address is required"),
        addressDetail: z.string().optional(),
        postalCode: z.string().min(1, "Postal code is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Check authorization
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this order",
          });
        }

        // Check if shipment already exists
        const existingShipment = await getShipmentByOrderId(input.orderId);
        if (existingShipment) {
          // Update existing shipment
          await updateShipment(input.orderId, {
            recipientName: input.recipientName,
            recipientPhone: input.recipientPhone,
            address: input.address,
            addressDetail: input.addressDetail,
            postalCode: input.postalCode,
            updatedAt: new Date(),
          });
        } else {
          // Create new shipment
          await createShipment({
            orderId: input.orderId,
            recipientName: input.recipientName,
            recipientPhone: input.recipientPhone,
            address: input.address,
            addressDetail: input.addressDetail,
            postalCode: input.postalCode,
            status: "pending",
          });
        }

        return { success: true, message: "Shipment information saved" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error creating shipment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save shipment information",
        });
      }
    }),

  /**
   * Get shipment information for an order
   */
  getShipment: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ ctx, input: orderId }) => {
      try {
        const order = await getOrderById(orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Check authorization
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view this order",
          });
        }

        const shipment = await getShipmentByOrderId(orderId);
        return shipment || null;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Orders] Error fetching shipment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch shipment information",
        });
      }
    }),
});
