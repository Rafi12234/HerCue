import { useMemo } from 'react';

import { useDashboardStore } from '../stores/dashboardStore';
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

  return useMemo(
    () => ({
      status,
      data,
      isPreview: data.source === 'PREVIEW',
      isEmpty: !selectHasAnyCareData(data),
      nextReminder: selectNextReminder(data),
      nextMedicineDose: selectNextMedicineDose(data.medicine),
      waterProgress: selectWaterProgress(data.water),
      medicineProgress: selectMedicineProgress(data.medicine),
    }),
    [status, data]
  );
}
