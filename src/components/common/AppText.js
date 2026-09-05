import { Text } from 'react-native';

import { typography } from '../../theme/typography';

/**
 * Text always flows through a typography token.
 *
 * `numberOfLines` is left to the caller, but long values (medicine names) must
 * be given a shrinkable parent — see the layout rules in the docs.
 */
export function AppText({ variant = 'body', color, align, style, children, ...rest }) {
  return (
    <Text
      style={[
        typography[variant] ?? typography.body,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
