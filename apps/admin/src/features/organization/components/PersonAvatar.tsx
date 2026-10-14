import Avatar from 'antd/es/avatar';

const AVATAR_COLORS = ['#3370ff', '#00a870', '#ff8800', '#7b61ff', '#e65050', '#14a9a0'];

function getAvatarText(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.length > 2 ? trimmed.slice(-2) : trimmed;
}

function getAvatarColor(seed: string) {
  const sum = seed.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

interface PersonAvatarProps {
  name?: string | null;
  src?: string | null;
  seed: string;
  size?: number;
  className?: string;
}

export function PersonAvatar({ name, src, seed, size = 32, className }: PersonAvatarProps) {
  return (
    <Avatar
      className={className}
      size={size}
      src={src || undefined}
      style={{ backgroundColor: getAvatarColor(seed), flexShrink: 0 }}
    >
      {getAvatarText(name ?? '')}
    </Avatar>
  );
}
