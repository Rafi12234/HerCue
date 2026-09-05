/** Warm, non-judgemental copy. Never guilt, never medical, never streak shame. */

const SUBTITLES_MORNING = [
  'One little thing at a time.',
  'Take today gently.',
  'A soft start is still a start.',
];

const SUBTITLES_AFTERNOON = [
  'Still here, still looking after you.',
  'A small pause counts too.',
  'One little thing at a time.',
];

const SUBTITLES_EVENING = [
  'The day can wind down now.',
  'Whatever got done was enough.',
  'A calm evening to you.',
];

const SUBTITLES_NIGHT = [
  'Rest whenever you are ready.',
  'Tomorrow is a fresh day.',
];

/** Stable for the whole day so the greeting does not flicker between renders. */
function pickForDay(list, date) {
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return list[dayIndex % list.length];
}

export function greetingSubtitle(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return pickForDay(SUBTITLES_NIGHT, date);
  if (hour < 12) return pickForDay(SUBTITLES_MORNING, date);
  if (hour < 17) return pickForDay(SUBTITLES_AFTERNOON, date);
  if (hour < 21) return pickForDay(SUBTITLES_EVENING, date);
  return pickForDay(SUBTITLES_NIGHT, date);
}

export function greetingOrnament(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return '🌙';
  if (hour < 12) return '🌷';
  if (hour < 17) return '🌤';
  if (hour < 21) return '🌸';
  return '🌙';
}

export const EMPTY_COPY = {
  noMedicines: 'No medicines added yet 🌷',
  noActivity: 'Your day is just getting started.',
  noPeriodHistory: 'Add the first day of your last period to begin tracking.',
  noNotifications: 'Nothing new right now ✨',
  nothingMissed: 'Nothing missed today. Lovely ✨',
};

export const CONFIRMATION_COPY = {
  WATER: 'Noted 💧',
  MEDICINE: 'Taken 🌿',
  BATHROOM: 'Noted ✨',
  FOOD: 'Noted 🍚',
  PERIOD: 'Logged 🌸',
};
