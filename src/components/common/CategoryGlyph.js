import { Bath, Droplet, Flower2, Pill, UtensilsCrossed } from 'lucide-react-native';

import { REMINDER_TYPES } from '../../constants/reminderTypes';

/**
 * One glyph per care category.
 *
 * Rendered through a switch rather than a lookup table so no component is ever
 * constructed during render — the icon language stays consistent everywhere it
 * appears without costing a remount.
 */
export function CategoryGlyph({ type, size = 18, color, strokeWidth = 2.1 }) {
  const props = { size, color, strokeWidth };

  switch (type) {
    case REMINDER_TYPES.MEDICINE:
      return <Pill {...props} />;
    case REMINDER_TYPES.BATHROOM:
      return <Bath {...props} />;
    case REMINDER_TYPES.FOOD:
      return <UtensilsCrossed {...props} />;
    case REMINDER_TYPES.PERIOD:
      return <Flower2 {...props} />;
    case REMINDER_TYPES.WATER:
    default:
      return <Droplet {...props} />;
  }
}
