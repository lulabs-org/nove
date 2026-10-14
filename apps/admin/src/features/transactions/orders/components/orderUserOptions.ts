import type { OrderRelation, OrderUserOption } from '../types';

interface UserSelectOption {
  value: string;
  label: string;
}

export function formatOrderUserOption(user: OrderUserOption): UserSelectOption {
  const phone = [user.countryCode, user.phone].filter(Boolean).join(' ');
  const name =
    user.fullName ||
    user.displayName ||
    (user as { profile?: { displayName?: string | null } }).profile?.displayName ||
    user.username ||
    user.email ||
    phone ||
    user.id;
  const details = [user.email, phone].filter(
    (item, index, all) => item && item !== name && all.indexOf(item) === index
  );

  return {
    value: user.id,
    label: details.length > 0 ? `${name} · ${details.join(' · ')}` : name,
  };
}

export function formatOrderRelationOption(user?: OrderRelation | null): UserSelectOption | null {
  if (!user) return null;
  const value = String(user.id);
  const name = user.name || user.code || user.email || value;
  return {
    value,
    label: user.email && user.email !== name ? `${name} · ${user.email}` : name,
  };
}

export function mergeOrderUserOptions(
  users: OrderUserOption[],
  initialUser?: OrderRelation | null
): UserSelectOption[] {
  const options = users.map(formatOrderUserOption);
  const initialOption = formatOrderRelationOption(initialUser);
  if (initialOption && !options.some((option) => option.value === initialOption.value)) {
    options.unshift(initialOption);
  }
  return options;
}
