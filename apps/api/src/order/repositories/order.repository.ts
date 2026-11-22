import { Injectable } from '@nestjs/common';
import { Order, Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const orderInclude = {
  product: {
    select: {
      id: true,
      productCode: true,
      name: true,
    },
  },
  purchaser: {
    select: {
      id: true,
      username: true,
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
  channel: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  currentOwner: {
    select: {
      id: true,
      username: true,
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
  financialCloser: {
    select: {
      id: true,
      username: true,
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
  tagLinks: {
    orderBy: { position: 'asc' },
    select: { tag: { select: { name: true } } },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

const benefitAdjustmentInclude = {
  operator: {
    select: {
      id: true,
      username: true,
      email: true,
      profile: {
        select: {
          displayName: true,
        },
      },
    },
  },
} satisfies Prisma.OrderBenefitAdjustmentInclude;

export type OrderBenefitAdjustmentWithOperator =
  Prisma.OrderBenefitAdjustmentGetPayload<{
    include: typeof benefitAdjustmentInclude;
  }>;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建订单并写入标签。标签名需已规范化（trim、去空、去重）。
   * 标签字典与订单关联在同一事务内写入。
   */
  async create(
    data: Prisma.OrderCreateInput,
    tags: string[] = [],
  ): Promise<OrderWithRelations> {
    if (tags.length === 0) {
      return this.prisma.order.create({ data, include: orderInclude });
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureTags(tx, tags);
      return tx.order.create({
        data: { ...data, tagLinks: { create: this.toTagLinks(tags) } },
        include: orderInclude,
      });
    });
  }

  async findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderCode },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  async findByChannelIdAndExternalId(
    channelId: number,
    externalId: string,
  ): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: {
        channelId_externalId: {
          channelId,
          externalId,
        },
      },
    });
  }

  async findMany(options: {
    skip: number;
    take: number;
    where: Prisma.OrderWhereInput;
    orderBy: Prisma.OrderOrderByWithRelationInput;
  }): Promise<{ items: OrderWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: options.where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
        include: orderInclude,
      }),
      this.prisma.order.count({ where: options.where }),
    ]);

    return { items, total };
  }

  /**
   * 更新订单。传入 tags 时整体替换订单标签（空数组即清空），
   * 不传则保持原有标签不变。
   */
  async update(
    id: string,
    data: Prisma.OrderUpdateInput,
    tags?: string[],
  ): Promise<OrderWithRelations> {
    if (tags === undefined) {
      return this.prisma.order.update({
        where: { id },
        data,
        include: orderInclude,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureTags(tx, tags);
      return tx.order.update({
        where: { id },
        data: {
          ...data,
          tagLinks: { deleteMany: {}, create: this.toTagLinks(tags) },
        },
        include: orderInclude,
      });
    });
  }

  /**
   * 返回被指定范围内订单引用的标签名（未排序、不限数量）。
   * 订单可见范围直接下推到 SQL，避免候选项泄露无权查看订单的标签。
   */
  async findTagNames(orderWhere: Prisma.OrderWhereInput): Promise<string[]> {
    const tags = await this.prisma.orderTag.findMany({
      where: { orderLinks: { some: { order: orderWhere } } },
      select: { name: true },
    });
    return tags.map((tag) => tag.name);
  }

  // 补齐标签字典；并发写入同名标签时由唯一约束 + skipDuplicates 兜底
  private async ensureTags(
    tx: Prisma.TransactionClient,
    tags: string[],
  ): Promise<void> {
    if (tags.length === 0) return;
    await tx.orderTag.createMany({
      data: tags.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  private toTagLinks(
    tags: string[],
  ): Prisma.OrderTagLinkCreateWithoutOrderInput[] {
    return tags.map((name, position) => ({
      position,
      tag: { connect: { name } },
    }));
  }

  async softDelete(id: string): Promise<OrderWithRelations> {
    return this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: orderInclude,
    });
  }

  async productExists(id: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!product;
  }

  async findProductById(
    id: string,
  ): Promise<{ id: string; name: string; durationDays: number | null } | null> {
    return this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, durationDays: true },
    });
  }

  async userExists(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  async channelExists(id: number): Promise<boolean> {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!channel;
  }

  async executeBenefitAdjustment(params: {
    orderId: string;
    orderUpdate: Prisma.OrderUpdateInput;
    adjustmentCreate: Prisma.OrderBenefitAdjustmentCreateInput;
  }): Promise<{
    order: OrderWithRelations;
    adjustment: OrderBenefitAdjustmentWithOperator;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: params.orderId },
        data: params.orderUpdate,
        include: orderInclude,
      });

      const adjustment = await tx.orderBenefitAdjustment.create({
        data: params.adjustmentCreate,
        include: benefitAdjustmentInclude,
      });

      return { order, adjustment };
    });
  }

  async findBenefitAdjustments(
    orderId: string,
  ): Promise<OrderBenefitAdjustmentWithOperator[]> {
    return this.prisma.orderBenefitAdjustment.findMany({
      where: { orderId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: benefitAdjustmentInclude,
    });
  }
}
