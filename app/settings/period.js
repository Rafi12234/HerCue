import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { StepperField } from '../../src/components/form/StepperField';
import { TimeField } from '../../src/components/form/TimeField';
import { REMINDER_TYPES } from '../../src/constants/reminderTypes';
import { SETTING_KEYS } from '../../src/constants/settingKeys';
import { loadSettings, updateSetting } from '../../src/services/settings/settingsService';
import { reschedulePeriodReminders } from '../../src/services/period/periodService';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { layout, spacing } from '../../src/theme/spacing';
import { LOG_CATEGORY, logger } from '../../src/utils/logger';

const accent = categoryColors[REMINDER_TYPES.PERIOD];

/** Offsets the user can switch on, in days before the estimated date. */
const OFFSETS = [
  { days: 3, label: 'Three days before' },
  { days: 1, label: 'The day before' },
  { days: 0, label: 'On the expected day' },
];

export default function PeriodSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const patch = useCallback((changes) => {
    setSettings((current) => ({ ...current, ...changes }));
  }, []);

  const toggleOffset = useCallback(
    (days) => {
      const current = settings?.periodRemindDaysBefore ?? [];
      patch({
        periodRemindDaysBefore: current.includes(days)
          ? current.filter((value) => value !== days)
          : [...current, days].sort((a, b) => b - a),
      });
    },
    [settings, patch]
  );

  const handleSave = useCallback(async () => {
    if (!settings || saving) return;
    setSaving(true);

    try {
      await updateSetting(SETTING_KEYS.PERIOD_REMINDERS_ENABLED, settings.periodRemindersEnabled);
      await updateSetting(SETTING_KEYS.PERIOD_REMIND_DAYS_BEFORE, settings.periodRemindDaysBefore);
      await updateSetting(SETTING_KEYS.PERIOD_REMIND_TIME, settings.periodRemindTime);
      await updateSetting(
        SETTING_KEYS.AVERAGE_CYCLE_LENGTH_DAYS,
        settings.averageCycleLengthDays
      );

      await reschedulePeriodReminders();
      router.back();
    } catch (error) {
      logger.error(LOG_CATEGORY.PERIOD, 'Could not save period settings', error);
    } finally {
      setSaving(false);
    }
  }, [settings, saving, router]);

  if (!settings) {
    return (
      <ScreenContainer tone="period">
        <AppHeader title="Period reminders" subtitle="Gentle, never clinical." />
      </ScreenContainer>
    );
  }

  const selected = settings.periodRemindDaysBefore ?? [];

  return (
    <ScreenContainer tone="period">
      <AppHeader
        title="Period reminders"
        subtitle="A quiet heads-up before the date you’re expecting."
      />

      <Card padded={false} style={styles.card}>
        <SettingsRow
          label="Remind me"
          description={
            settings.periodRemindersEnabled
              ? 'HerCue will nudge you before the expected date'
              : 'Tracking still works — nothing will alert you'
          }
          toggleValue={settings.periodRemindersEnabled}
          onToggle={() => patch({ periodRemindersEnabled: !settings.periodRemindersEnabled })}
          iconTint={accent.tint}
          iconColor={accent.deep}
          isLast
        />
      </Card>

      <SectionHeader title="When" style={styles.section} />
      <Card padded={false} style={styles.card}>
        {OFFSETS.map((offset, index) => (
          <SettingsRow
            key={offset.days}
            label={offset.label}
            toggleValue={selected.includes(offset.days)}
            onToggle={() => toggleOffset(offset.days)}
            iconTint={accent.tint}
            iconColor={accent.deep}
            isLast={index === OFFSETS.length - 1}
          />
        ))}
      </Card>

      <Card style={styles.timeCard}>
        <TimeField
          label="Time of day"
          value={settings.periodRemindTime ?? '09:00'}
          onChange={(value) => patch({ periodRemindTime: value })}
          tint={accent.tint}
          accent={accent.deep}
        />
      </Card>

      <SectionHeader
        title="Cycle length"
        caption="Used only until enough of your own history exists"
        style={styles.section}
      />
      <Card>
        <StepperField
          label="Average cycle"
          value={settings.averageCycleLengthDays ?? 28}
          onChange={(value) => patch({ averageCycleLengthDays: value })}
          min={20}
          max={45}
          format={(value) => `${value} days`}
          tint={accent.tint}
          accent={accent.deep}
        />
        <AppText variant="caption" color={colors.textFaint} style={styles.note}>
          Once you’ve recorded a few cycles, HerCue uses your own average instead. Cycles vary
          naturally — this is only an estimate.
        </AppText>
      </Card>

      <PressableScale
        onPress={handleSave}
        disabled={saving}
        haptic="press"
        scaleTo={0.97}
        style={[styles.save, { backgroundColor: accent.base }]}
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
  section: {
    marginTop: layout.sectionGap,
  },
  timeCard: {
    marginTop: layout.cardGap,
  },
  note: {
    marginTop: spacing.md,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: layout.sectionGap,
    paddingVertical: spacing.base,
    borderRadius: radii.pill,
  },
});
