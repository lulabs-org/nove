import { useMemo } from 'react';
import { subject } from '@casl/ability';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { createOrderAbility, type OrderAction } from '../security/orderAbility';
import type { Order } from '../types';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function useOrderAbility() {
  const { user } = useAuth();

  const ability = useMemo(() => createOrderAbility(user), [user]);

  const can = (action: OrderAction, record?: Order | 'Order'): boolean => {
    if (!record || record === 'Order') {
      return ability.can(action, 'Order');
    }
    return ability.can(action, subject('Order', record));
  };

  const checkOrderEdit = (order: Order): PermissionCheckResult => {
    const isSuperOrAdmin =
      user?.permissions?.includes('*') ||
      user?.permissions?.includes('order:admin') ||
      user?.roles?.includes('SUPER_ADMIN') ||
      user?.roles?.includes('ADMIN');

    if (isSuperOrAdmin) {
      return { allowed: true };
    }

    if (!user?.permissions?.includes('order:update') && !user?.permissions?.includes('order:*')) {
      return { allowed: false, reason: '缺少订单编辑权限' };
    }

    if (order.status === 'CANCELLED') {
      return { allowed: false, reason: '已取消的订单不可编辑' };
    }

    if (order.status === 'COMPLETED') {
      return { allowed: false, reason: '已完成的订单不可编辑' };
    }

    if (order.currentOwnerId && order.currentOwnerId !== user.id) {
      return { allowed: false, reason: '无权编辑他人负责的订单' };
    }

    const allowed = ability.can('update', subject('Order', order));
    return {
      allowed,
      reason: allowed ? undefined : '无权编辑该订单',
    };
  };

  const checkBenefitAdjustment = (order: Order): PermissionCheckResult => {
    const isSuperOrAdmin =
      user?.permissions?.includes('*') ||
      user?.permissions?.includes('order:admin') ||
      user?.roles?.includes('SUPER_ADMIN') ||
      user?.roles?.includes('ADMIN');

    if (isSuperOrAdmin) {
      return { allowed: true };
    }

    if (!user?.permissions?.includes('order:update') && !user?.permissions?.includes('order:*')) {
      return { allowed: false, reason: '缺少权益调整权限' };
    }

    if (order.status !== 'PAID' && order.status !== 'FROZEN') {
      return { allowed: false, reason: '仅已支付或已冻结订单可调整权益' };
    }

    if (order.currentOwnerId && order.currentOwnerId !== user.id) {
      return { allowed: false, reason: '无权调整他人负责的订单权益' };
    }

    const allowed = ability.can('adjustBenefit', subject('Order', order));
    return {
      allowed,
      reason: allowed ? undefined : '无权调整该订单权益',
    };
  };

  const checkOrderDelete = (order: Order): PermissionCheckResult => {
    const allowed = ability.can('delete', subject('Order', order));
    return {
      allowed,
      reason: allowed ? undefined : '无权删除订单',
    };
  };

  return {
    ability,
    can,
    checkOrderEdit,
    checkBenefitAdjustment,
    checkOrderDelete,
  };
}
