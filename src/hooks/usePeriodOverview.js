import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getPeriodOverview } from '../services/period/periodService';
import { LOG_CATEGORY, logger } from '../utils/logger';

/** Cycle history and estimate, re-read whenever the Period screen is shown. */
export function usePeriodOverview() {
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      setOverview(await getPeriodOverview());
      setStatus('ready');
    } catch (error) {
      logger.error(LOG_CATEGORY.PERIOD, 'Could not load cycle history', error);
      setStatus('failed');
    }
  }, []);

  // Fires on first focus too, so no separate mount effect is needed.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { overview, status, reload: load };
}
