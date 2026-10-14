import { describe, expect, it } from 'vitest';
import { subject } from '@casl/ability';
import { createOrderAbility } from './orderAbility';
import type { User } from '../../../auth/model/types';
import type { Order } from '../types';

describe('createOrderAbility', () => {
  const baseOrder: Order = {
    id: 'order-1',
    orderCode: 'ORD001',
    orderNumber: 'ON001',
    externalId: null,
    metadata: null,
    productId: 'prod-1',
    productName: 'VIP 课程',
    purchaserId: 'user-purchaser',
    channelId: 1,
    email: 'test@example.com',
    phone: '13800000000',
    phoneCode: '+86',
    currentOwnerId: 'sales-1',
    financialCloserId: null,
    financialClosedAt: null,
    amount: 9900,
    currency: 'CNY',
    amountCny: 9900,
    fxRateToCny: null,
    fxLockedAt: null,
    status: 'PAID',
    paidAt: '2026-01-01T00:00:00Z',
    cancelledAt: null,
    completedAt: null,
    durationDays: 30,
    benefitStart: '2026-01-01T00:00:00Z',
    benefitEnd: '2026-02-01T00:00:00Z',
    frozenDays: 0,
    frozenAt: null,
    paymentProvider: null,
    providerTradeNo: null,
    product: null,
    purchaser: null,
    channel: null,
    currentOwner: null,
    financialCloser: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    deletedAt: null,
  };

  const adminUser: User = {
    id: 'admin-1',
    email: 'admin@nove.com',
    name: 'Admin',
    roles: ['ADMIN'],
    permissions: ['order:admin'],
    emailVerified: true,
    phoneVerified: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const salesUser: User = {
    id: 'sales-1',
    email: 'sales1@nove.com',
    name: 'Sales One',
    roles: ['USER'],
    permissions: ['order:read', 'order:update'],
    emailVerified: true,
    phoneVerified: true,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('grants full management rights to admin', () => {
    const ability = createOrderAbility(adminUser);
    expect(ability.can('read', 'Order')).toBe(true);
    expect(ability.can('update', subject('Order', baseOrder))).toBe(true);
    expect(ability.can('delete', subject('Order', baseOrder))).toBe(true);
  });

  it('allows sales to read owned order or unassigned order', () => {
    const ability = createOrderAbility(salesUser);
    expect(ability.can('read', subject('Order', baseOrder))).toBe(true);

    const unassignedOrder = { ...baseOrder, currentOwnerId: null };
    expect(ability.can('read', subject('Order', unassignedOrder))).toBe(true);

    const otherSalesOrder = { ...baseOrder, currentOwnerId: 'sales-2' };
    expect(ability.can('read', subject('Order', otherSalesOrder))).toBe(false);
  });

  it('allows sales to update owned order in PAID status', () => {
    const ability = createOrderAbility(salesUser);
    expect(ability.can('update', subject('Order', baseOrder))).toBe(true);
  });

  it('forbids sales from updating cancelled or completed orders', () => {
    const ability = createOrderAbility(salesUser);

    const cancelledOrder: Order = { ...baseOrder, status: 'CANCELLED' };
    expect(ability.can('update', subject('Order', cancelledOrder))).toBe(false);

    const completedOrder: Order = { ...baseOrder, status: 'COMPLETED' };
    expect(ability.can('update', subject('Order', completedOrder))).toBe(false);
  });

  it('forbids sales from deleting orders', () => {
    const ability = createOrderAbility(salesUser);
    expect(ability.can('delete', subject('Order', baseOrder))).toBe(false);
  });
});
