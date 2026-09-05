/**
 * Development logger.
 *
 * Production builds stay silent for everything below `warn` so private routine,
 * medicine and cycle details never reach device logs.
 */

export const LOG_CATEGORY = {
  DB: 'DB',
  SCHEDULER: 'SCHEDULER',
  NOTIFICATION: 'NOTIFICATION',
  TTS: 'TTS',
  UI: 'UI',
  PERIOD: 'PERIOD',
  ANALYTICS: 'ANALYTICS',
  PERMISSION: 'PERMISSION',
};

const format = (level, category, message) =>
  `[HerCue][${level}][${category}] ${message}`;

const emit = (level, consoleMethod, category, message, detail) => {
  const line = format(level, category, message);
  if (detail === undefined) {
    consoleMethod(line);
  } else {
    consoleMethod(line, detail);
  }
};

export const logger = {
  debug(category, message, detail) {
    if (!__DEV__) return;
    emit('debug', console.log, category, message, detail);
  },
  info(category, message, detail) {
    if (!__DEV__) return;
    emit('info', console.log, category, message, detail);
  },
  warn(category, message, detail) {
    emit('warn', console.warn, category, message, detail);
  },
  error(category, message, detail) {
    emit('error', console.error, category, message, detail);
  },
};
