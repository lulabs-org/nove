import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import type { User } from '../../../auth/model/types';
import type { Order } from '../types';

export type OrderAction = 'manage' | 'read' | 'create' | 'update' | 'delete' | 'adjustBenefit';

export type OrderSubject = 'Order' | Order;

export type OrderAbility = MongoAbility<[OrderAction, OrderSubject]>;

export function createOrderAbility(user: User | null): OrderAbility {
  const { can, cannot, build } = new AbilityBuilder<OrderAbility>(createMongoAbility);

  if (!user || !user.id) {
    return build();
  }

  const permissions = user.permissions || [];
  const roles = user.roles || [];

  const isSuperOrAdmin =
    permissions.includes('*') ||
    permissions.includes('order:admin') ||
    permissions.includes('admin') ||
    roles.includes('SUPER_ADMIN') ||
    roles.includes('ADMIN');

  if (isSuperOrAdmin) {
    can('manage', 'Order');
    return build();
  }

  // 1. 读取权限 (read)
  if (permissions.includes('order:read') || permissions.includes('order:*')) {
    can('read', 'Order', { currentOwnerId: user.id });
    can('read', 'Order', { currentOwnerId: null });
    can('read', 'Order', { purchaserId: user.id });
  }

  // 2. 创建权限 (create)
  if (permissions.includes('order:create') || permissions.includes('order:*')) {
    can('create', 'Order');
  }

  // 3. 更新权限 (update)
  if (permissions.includes('order:update') || permissions.includes('order:*')) {
    can('update', 'Order', { currentOwnerId: user.id });

    // 状态限制：已取消和已完成的订单普通人员不可修改
    cannot('update', 'Order', { status: 'CANCELLED' });
    cannot('update', 'Order', { status: 'COMPLETED' });
  }

  // 4. 权益调整权限 (adjustBenefit)
  if (permissions.includes('order:update') || permissions.includes('order:*')) {
    can('adjustBenefit', 'Order', {
      currentOwnerId: user.id,
      status: { $in: ['PAID', 'FROZEN'] },
    });
  }

  // 5. 删除权限 (delete)
  if (permissions.includes('order:delete') || permissions.includes('order:*')) {
    can('delete', 'Order');
  }

  return build();
}
