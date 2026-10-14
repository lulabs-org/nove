import type { OrderChannelOption, OrderRelation } from '../types';

interface ChannelSelectOption {
  value: number;
  label: string;
}

export function formatOrderChannelOption(channel: OrderChannelOption): ChannelSelectOption {
  return {
    value: channel.id,
    label:
      channel.code && channel.code !== channel.name
        ? `${channel.name} · ${channel.code}`
        : channel.name,
  };
}

export function formatOrderChannelRelation(
  channel?: OrderRelation | null
): ChannelSelectOption | null {
  if (!channel) return null;
  const value = Number(channel.id);
  const name = channel.name || channel.code || String(channel.id);
  return {
    value,
    label: channel.code && channel.code !== name ? `${name} · ${channel.code}` : name,
  };
}

export function mergeOrderChannelOptions(
  channels: OrderChannelOption[],
  initialChannel?: OrderRelation | null
): ChannelSelectOption[] {
  const options = channels.map(formatOrderChannelOption);
  const initialOption = formatOrderChannelRelation(initialChannel);
  if (initialOption && !options.some((option) => option.value === initialOption.value)) {
    options.unshift(initialOption);
  }
  return options;
}
