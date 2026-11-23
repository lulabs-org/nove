import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { OrderRepository } from '../../../src/order/repositories/order.repository';

describe('OrderRepository tags (PostgreSQL)', () => {
  const prefix = `tagit-${randomUUID().slice(0, 8)}`;
  const tag = (name: string) => `${prefix}-${name}`;
  let prisma: PrismaService;
  let repository: OrderRepository;
  let seq = 0;

  const createOrder = (tags?: string[]) => {
    seq += 1;
    return repository.create(
      {
        orderCode: `${prefix}-code-${seq}`,
        orderNumber: `${prefix}-no-${seq}`,
        amount: 100,
      },
      tags,
    );
  };

  const tagNames = (order: { tagLinks: { tag: { name: string } }[] }) =>
    order.tagLinks.map((link) => link.tag.name);

  const countTags = (names: string[]) =>
    prisma.orderTag.count({ where: { name: { in: names } } });

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    repository = new OrderRepository(prisma);
  });

  afterAll(async () => {
    try {
      await prisma.order.deleteMany({
        where: { orderCode: { startsWith: prefix } },
      });
      await prisma.orderTag.deleteMany({
        where: { name: { startsWith: prefix } },
      });
    } finally {
      await prisma.onModuleDestroy();
    }
  });

  it('stores tags as dictionary entries and keeps the input order', async () => {
    const names = [tag('乙'), tag('甲'), tag('丙')];

    const order = await createOrder(names);

    expect(tagNames(order)).toEqual(names);
    expect(await countTags(names)).toBe(3);
  });

  it('reuses existing dictionary entries instead of duplicating them', async () => {
    const shared = tag('shared');

    await createOrder([shared]);
    const second = await createOrder([shared, tag('only-second')]);

    expect(tagNames(second)).toEqual([shared, tag('only-second')]);
    expect(await countTags([shared])).toBe(1);
  });

  it('creates an order without tags', async () => {
    const order = await createOrder();

    expect(order.tagLinks).toEqual([]);
  });

  it('replaces, keeps and clears tags on update', async () => {
    const order = await createOrder([tag('a'), tag('b')]);

    const replaced = await repository.update(order.id, {}, [
      tag('c'),
      tag('a'),
    ]);
    expect(tagNames(replaced)).toEqual([tag('c'), tag('a')]);

    const kept = await repository.update(order.id, { amount: 200 });
    expect(kept.amount).toBe(200);
    expect(tagNames(kept)).toEqual([tag('c'), tag('a')]);

    const cleared = await repository.update(order.id, {}, []);
    expect(cleared.tagLinks).toEqual([]);
    // 字典条目保留，供其他订单复用
    expect(await countTags([tag('a'), tag('b'), tag('c')])).toBe(3);
  });

  it('handles concurrent orders introducing the same new tag', async () => {
    const fresh = tag('concurrent');

    const orders = await Promise.all(
      Array.from({ length: 5 }, () => createOrder([fresh])),
    );

    orders.forEach((order) => expect(tagNames(order)).toEqual([fresh]));
    expect(await countTags([fresh])).toBe(1);
  });

  it('handles concurrent orders introducing the same new tags in opposite orders', async () => {
    const pairs = Array.from({ length: 10 }, (_, i) => [
      tag(`swap-${i}-a`),
      tag(`swap-${i}-b`),
    ]);

    const orders = await Promise.all(
      pairs.flatMap(([a, b]) => [createOrder([a, b]), createOrder([b, a])]),
    );

    pairs.forEach(([a, b], i) => {
      expect(tagNames(orders[i * 2])).toEqual([a, b]);
      expect(tagNames(orders[i * 2 + 1])).toEqual([b, a]);
    });
    expect(await countTags(pairs.flat())).toBe(20);
  });

  it('filters orders by tag through the relation', async () => {
    const target = tag('filter-target');
    const hit = await createOrder([target, tag('filter-other')]);
    await createOrder([tag('filter-other')]);

    const { items, total } = await repository.findMany({
      skip: 0,
      take: 10,
      where: {
        orderCode: { startsWith: prefix },
        tagLinks: { some: { tag: { name: target } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(total).toBe(1);
    expect(items.map((item) => item.id)).toEqual([hit.id]);
  });

  it('lists only tags referenced by orders in the given scope', async () => {
    const visible = await createOrder([tag('scope-visible')]);
    const deleted = await createOrder([tag('scope-deleted')]);
    await repository.softDelete(deleted.id);
    await createOrder([tag('scope-other')]);
    // 字典中存在但没有任何订单引用的标签
    await prisma.orderTag.create({ data: { name: tag('scope-orphan') } });

    const names = await repository.findTagNames({
      id: { in: [visible.id, deleted.id] },
      deletedAt: null,
    });

    expect(names).toEqual([tag('scope-visible')]);
  });
});
