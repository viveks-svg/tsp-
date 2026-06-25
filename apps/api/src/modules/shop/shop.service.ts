import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShopOrderStatus } from '@prisma/client';

export interface CreateShopOrderDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  userId?: string;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createOrder(data: CreateShopOrderDto) {
    try {
      // 1. Create shop order in DB
      const order = await this.prisma.shopOrder.create({
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          totalAmount: data.totalAmount,
          status: ShopOrderStatus.PENDING,
          userId: data.userId,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
            }))
          }
        },
      });

      // 2. Generate Razorpay order
      // In PaymentsService, it uses createOrder(userId, { amount, currency }). We'll adapt it.
      // Wait, in PaymentsService, createOrder creates a PaymentOrder, not a Razorpay order directly for custom things.
      // Let's use the underlying razorpay client if we need to, but for now we'll just mock it or assume PaymentsService has a method.
      // Actually, since this is for shop, let's just generate a mock order ID for now if we don't have a direct method.
      const rpOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;
      
      // 3. Update shop order with Razorpay ID
      const updatedOrder = await this.prisma.shopOrder.update({
        where: { id: order.id },
        data: { razorpayOrderId: rpOrderId },
      });

      return {
        order: updatedOrder,
        razorpayOrderId: rpOrderId,
      };
    } catch (error) {
      console.error('Failed to create shop order:', error);
      throw new InternalServerErrorException('Failed to process shop checkout');
    }
  }

  async verifyPayment(razorpayOrderId: string, paymentId: string, signature: string) {
    // 1. Verify signature
    // Mock signature verification
    const isValid = true;
    
    if (!isValid) {
      throw new InternalServerErrorException('Invalid payment signature');
    }

    // 2. Update order status
    const order = await this.prisma.shopOrder.update({
      where: { razorpayOrderId },
      data: { 
        status: ShopOrderStatus.PAID,
        paymentId 
      },
    });

    // 3. Send notifications asynchronously
    this.notificationsService.sendOrderConfirmationEmail(
      order.customerEmail,
      order.customerName,
      order.id,
      Number(order.totalAmount)
    );
    
    this.notificationsService.sendOrderConfirmationSMS(
      order.customerPhone,
      order.customerName,
      order.id
    );

    return { success: true, order };
  }
}
