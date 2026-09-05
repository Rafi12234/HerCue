import { useCallback, useMemo } from 'react';

import { DASHBOARD_STATUS, useDashboardStore } from '../stores/dashboardStore';
import {
  selectHasAnyCareData,
  selectMedicineProgress,
  selectNextMedicineDose,
  selectNextReminder,
  selectWaterProgress,
} from '../services/dashboard/selectors';

/** Read-only view-model for Home. Actions come from `careActions`. */
export function useDashboard() {
  const status = useDashboardStore((state) => state.status);
  const data = useDashboardStore((state) => state.data);
  const error = useDashboardStore((state) => state.error);
  const refreshStore = useDashboardStore((state) => state.refresh);

  const refresh = useCallback(() => refreshStore(), [refreshStore]);

  return useMemo(
    () => ({
      status,
      data,
      error,
      refresh,
      isLoading: status === DASHBOARD_STATUS.LOADING,
      isPreview: data.source === 'PREVIEW',
      isEmpty: !selectHasAnyCareData(data),
      nextReminder: selectNextReminder(data),
      nextMedicineDose: selectNextMedicineDose(data.medicine),
      waterProgress: selectWaterProgress(data.water),
      medicineProgress: selectMedicineProgress(data.medicine),
    }),
    [status, data, error, refresh]
  );
}
