import { forwardRef } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { pressScale, springs } from '../../theme/motion';
import { haptics } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Every tappable surface in HerCue compresses slightly on press.
 * `scaleTo` picks the amount from the motion tokens (card / button / icon).
 */
export const PressableScale = forwardRef(function PressableScale(
  {
    children,
    onPress,
    scaleTo = pressScale.card,
    haptic = 'tap',
    disabled = false,
    style,
    ...rest
  },
  ref
) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  const handlePress = (event) => {
    if (disabled) return;
    if (haptic && haptics[haptic]) haptics[haptic]();
    onPress?.(event);
  };

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withSpring(1, springs.snappy);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, springs.gentle);
      }}
      onPress={handlePress}
      style={[style, animatedStyle, disabled && { opacity: 0.55 }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
