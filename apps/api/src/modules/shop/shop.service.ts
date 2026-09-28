import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { RazorpayService } from '../payments/razorpay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShopOrderStatus } from '@prisma/client';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { SHOP_PRODUCTS } from '../../common/constants/shop-products';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly razorpayService: RazorpayService,
  ) {}

  /** Prices, names and the total come from the server's product list — never from the browser. */
  private priceItems(data: CreateShopOrderDto) {
    const merged = new Map<string, number>();
    for (const item of data.items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
    const items = [...merged].map(([productId, quantity]) => {
      const product = SHOP_PRODUCTS[productId];
      if (!product) throw new BadRequestException('One of the items is no longer available. Please refresh the shop.');
      if (quantity > 20) throw new BadRequestException('Please order at most 20 of each item.');
      return { productId, productName: product.name, pricePaise: product.pricePaise, quantity };
    });
    const totalPaise = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);
    return { items, totalPaise };
  }

  async createOrder(data: CreateShopOrderDto, userId: string | null) {
    const { items, totalPaise } = this.priceItems(data);
    try {
      // 1. Create shop order in DB
      const order = await this.prisma.shopOrder.create({
        data: {
          customerName: data.customerName,
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          totalAmount: totalPaise / 100,
          status: ShopOrderStatus.PENDING,
          userId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              price: item.pricePaise / 100,
              quantity: item.quantity,
            })),
          }
        },
      });

      // 2. Generate Razorpay order (mock orders only outside production, for local testing)
      const hasKeys = await this.razorpayService.isConfigured();
      if (!hasKeys && process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('Online payments are not configured yet.');
      }
      let rpOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
      
      if (hasKeys) {
        const rpOrder = await this.razorpayService.createOrder(
          totalPaise,
          'INR',
          order.id
        );
        if (rpOrder && rpOrder.id) {
          rpOrderId = rpOrder.id;
        }
      } else {
        console.warn('Razorpay credentials missing. Running in MOCK Mode.');
      }
      
      // 3. Update shop order with Razorpay ID
      const updatedOrder = await this.prisma.shopOrder.update({
        where: { id: order.id },
        data: { razorpayOrderId: rpOrderId },
      });

      return {
        order: updatedOrder,
        razorpayOrderId: rpOrderId,
        key: hasKeys ? await this.razorpayService.getKeyId() : null,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Failed to create shop order:', error);
      throw new InternalServerErrorException('Failed to process shop checkout');
    }
  }

  async verifyPayment(razorpayOrderId: string, paymentId: string, signature: string) {
    // 1. Verify signature
    const hasKeys = await this.razorpayService.isConfigured();
    let isValid = false;

    if (hasKeys) {
      isValid = await this.razorpayService.verifySignature(razorpayOrderId, paymentId, signature);
    } else if (process.env.NODE_ENV !== 'production') {
      // If no keys configured, allow mock verification for mock orders
      isValid = razorpayOrderId.startsWith('order_mock_') && signature === 'mock_signature';
    }
    
    if (!isValid) {
      throw new BadRequestException('We could not confirm this payment. If money was taken, it will be confirmed automatically or refunded.');
    }

    const outcome = await this.markPaid(razorpayOrderId, paymentId);
    if (outcome.result === 'NOT_PENDING') throw new BadRequestException('This order is not awaiting payment.');
    return { success: true, order: outcome.order };
  }

  /**
   * Marks a shop order paid — once. Used by the checkout callback and by the
   * Razorpay webhook (when the client closed the tab before our page could).
   * Only a PENDING order becomes PAID; replays change nothing and send nothing.
   */
  async markPaid(razorpayOrderId: string, paymentId: string) {
    const claimed = await this.prisma.shopOrder.updateMany({
      where: { razorpayOrderId, status: ShopOrderStatus.PENDING },
      data: { status: ShopOrderStatus.PAID, paymentId },
    });
    const order = await this.prisma.shopOrder.findUnique({ where: { razorpayOrderId }, include: { items: true } });
    if (!order) throw new BadRequestException('Order not found');
    if (claimed.count === 0) {
      return { result: order.paymentId === paymentId ? ('ALREADY_PAID' as const) : ('NOT_PENDING' as const), order };
    }
    void this.notificationsService.sendShopOrderConfirmation({ ...order, totalAmount: Number(order.totalAmount) });
    return { result: 'PAID' as const, order };
  }
}
