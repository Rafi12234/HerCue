import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light UI feedback only.
 *
 * This is deliberately separate from the reminder vibration engine
 * (`services/vibration`), which uses a much stronger deliberate waveform.
 */

const isSupported = Platform.OS === 'android' || Platform.OS === 'ios';

function safely(run) {
  if (!isSupported) return;
  // Haptics are a nicety; a device without a motor must never break an action.
  run().catch(() => {});
}

export const haptics = {
  selection() {
    safely(() => Haptics.selectionAsync());
  },
  tap() {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  press() {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  success() {
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  warning() {
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
