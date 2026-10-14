import Input from 'antd/es/input';
import type { ComponentProps } from 'react';

type SecretInputProps = ComponentProps<typeof Input.Password>;

export function SecretInput({ placeholder, ...inputProps }: SecretInputProps) {
  return (
    <Input.Password
      {...inputProps}
      autoComplete="new-password"
      placeholder={placeholder}
      visibilityToggle={false}
    />
  );
}
