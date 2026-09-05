import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, MoonStar } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { TimeField } from '../../src/components/form/TimeField';
import { SETTING_KEYS } from '../../src/constants/settingKeys';
import { reminderScheduler } from '../../src/services/reminder/reminderScheduler';
import { loadSettings, updateSetting } from '../../src/services/settings/settingsService';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { layout, spacing } from '../../src/theme/spacing';
import { LOG_CATEGORY, logger } from '../../src/utils/logger';

export default function QuietHoursScreen() {
  const router = useRouter();
  const hydrate = useSettingsStore((state) => state.hydrate);

  const [enabled, setEnabled] = useState(true);
  const [start, setStart] = useState('22:30');
  const [end, setEnd] = useState('07:30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setEnabled(settings.quietHoursEnabled);
      setStart(settings.quietHoursStart);
      setEnd(settings.quietHoursEnd);
    })();
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      await updateSetting(SETTING_KEYS.QUIET_HOURS_ENABLED, enabled);
      await updateSetting(SETTING_KEYS.QUIET_HOURS_START, start);
      await updateSetting(SETTING_KEYS.QUIET_HOURS_END, end);

      await hydrate();
      await reminderScheduler.reconcile('quiet-hours-changed');
      router.back();
    } catch (error) {
      logger.error(LOG_CATEGORY.UI, 'Could not save quiet hours', error);
    } finally {
      setSaving(false);
    }
  }, [saving, enabled, start, end, hydrate, router]);

  return (
    <ScreenContainer tone="settings">
      <AppHeader
        title="Quiet hours"
        subtitle="Water, food and bathroom reminders wait until morning. Medicine times are never moved."
      />

      <Card padded={false} style={styles.card}>
        <SettingsRow
          icon={MoonStar}
          label="Quiet hours"
          description={enabled ? 'Reminders are held back overnight' : 'Reminders can arrive at any hour'}
          toggleValue={enabled}
          onToggle={() => setEnabled((value) => !value)}
          isLast
        />
      </Card>

      <Card style={styles.times}>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TimeField label="From" value={start} onChange={setStart} />
          </View>
          <View style={styles.rowItem}>
            <TimeField label="Until" value={end} onChange={setEnd} />
          </View>
        </View>

        <AppText variant="caption" color={colors.textFaint}>
          A reminder that lands inside this window is moved to when it ends, not cancelled.
        </AppText>
      </Card>

      <PressableScale
        onPress={handleSave}
        disabled={saving}
        haptic="press"
        scaleTo={0.97}
        style={styles.save}
      >
        <Check size={17} color="#FFFFFF" strokeWidth={2.6} />
        <AppText variant="button" color="#FFFFFF">
          {saving ? 'Saving…' : 'Save'}
        </AppText>
      </PressableScale>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: layout.cardPadding,
  },
  times: {
    marginTop: layout.cardGap,
    gap: spacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: layout.sectionGap,
    paddingVertical: spacing.base,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
});
