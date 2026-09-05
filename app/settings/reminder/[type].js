import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';

import { AppHeader } from '../../../src/components/common/AppHeader';
import { AppText } from '../../../src/components/common/AppText';
import { Card } from '../../../src/components/common/Card';
import { PressableScale } from '../../../src/components/common/PressableScale';
import { ScreenContainer } from '../../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../../src/components/common/SectionHeader';
import { SettingsRow } from '../../../src/components/common/SettingsRow';
import { StepperField } from '../../../src/components/form/StepperField';
import { TimeField } from '../../../src/components/form/TimeField';
import { SETTING_KEYS } from '../../../src/constants/settingKeys';
import { REMINDER_TYPES } from '../../../src/constants/reminderTypes';
import { reminderScheduler } from '../../../src/services/reminder/reminderScheduler';
import {
  getReminderConfig,
  loadSettings,
  updateReminderConfig,
  updateSetting,
} from '../../../src/services/settings/settingsService';
import { useDashboardStore } from '../../../src/stores/dashboardStore';
import { categoryColors } from '../../../src/theme/colors';
import { radii } from '../../../src/theme/radii';
import { layout, spacing } from '../../../src/theme/spacing';
import { LOG_CATEGORY, logger } from '../../../src/utils/logger';

const COPY = {
  [REMINDER_TYPES.WATER]: {
    title: 'Water',
    subtitle: 'Gentle nudges through your day, never after hours.',
    intervalLabel: 'Remind me every',
    hasGoal: true,
  },
  [REMINDER_TYPES.FOOD]: {
    title: 'Food',
    subtitle: 'A check-in measured from your last confirmed meal.',
    intervalLabel: 'Check in after',
    hasGoal: false,
  },
  [REMINDER_TYPES.BATHROOM]: {
    title: 'Bathroom',
    subtitle: 'Entirely your choice — this is a personal preference, not advice.',
    intervalLabel: 'Remind me every',
    hasGoal: false,
  },
};

function formatMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export default function ReminderSettingsScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();

  const reminderType = String(type ?? '').toUpperCase();
  const copy = COPY[reminderType];
  const accent = categoryColors[reminderType] ?? categoryColors.WATER;

  const [config, setConfig] = useState(null);
  const [goal, setGoal] = useState(8);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [definition, settings] = await Promise.all([
        getReminderConfig(reminderType),
        loadSettings(),
      ]);
      setConfig(definition);
      setGoal(settings.waterDailyGoal);
    })();
  }, [reminderType]);

  const patch = useCallback((changes) => {
    setConfig((current) => ({ ...current, ...changes }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!config || saving) return;
    setSaving(true);

    try {
      await updateReminderConfig(reminderType, {
        enabled: config.enabled,
        intervalMinutes: config.intervalMinutes,
        activeStartTime: config.activeStartTime,
        activeEndTime: config.activeEndTime,
        snoozeMinutes: config.snoozeMinutes,
        voiceEnabled: config.voiceEnabled,
        vibrationEnabled: config.vibrationEnabled,
      });

      if (copy?.hasGoal) await updateSetting(SETTING_KEYS.WATER_DAILY_GOAL, goal);

      await reminderScheduler.reconcile(`${reminderType.toLowerCase()}-settings-changed`);
      await useDashboardStore.getState().refresh();
      router.back();
    } catch (error) {
      logger.error(LOG_CATEGORY.UI, 'Could not save reminder settings', error);
    } finally {
      setSaving(false);
    }
  }, [config, saving, reminderType, copy, goal, router]);

  if (!copy) {
    return (
      <ScreenContainer tone="settings">
        <AppHeader title="Reminder" subtitle="That reminder type isn’t available." />
      </ScreenContainer>
    );
  }

  if (!config) {
    return (
      <ScreenContainer tone="settings">
        <AppHeader title={copy.title} subtitle={copy.subtitle} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer tone="settings">
      <AppHeader title={copy.title} subtitle={copy.subtitle} />

      <Card padded={false} style={styles.card}>
        <SettingsRow
          label="Reminders on"
          description={
            config.enabled
              ? 'HerCue will alert you at these times'
              : 'Tracking still works — nothing will alert you'
          }
          toggleValue={config.enabled}
          onToggle={() => patch({ enabled: !config.enabled })}
          iconTint={accent.tint}
          iconColor={accent.deep}
          isLast
        />
      </Card>

      <SectionHeader title="Timing" style={styles.section} />
      <Card style={styles.stack}>
        <StepperField
          label={copy.intervalLabel}
          value={config.intervalMinutes ?? 60}
          onChange={(value) => patch({ intervalMinutes: value })}
          min={15}
          max={720}
          step={15}
          format={formatMinutes}
          tint={accent.tint}
          accent={accent.deep}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TimeField
              label="Active from"
              value={config.activeStartTime ?? '08:00'}
              onChange={(value) => patch({ activeStartTime: value })}
              tint={accent.tint}
              accent={accent.deep}
            />
          </View>
          <View style={styles.rowItem}>
            <TimeField
              label="Until"
              value={config.activeEndTime ?? '22:00'}
              onChange={(value) => patch({ activeEndTime: value })}
              tint={accent.tint}
              accent={accent.deep}
            />
          </View>
        </View>

        <StepperField
          label="Snooze for"
          value={config.snoozeMinutes ?? 15}
          onChange={(value) => patch({ snoozeMinutes: value })}
          min={5}
          max={60}
          step={5}
          format={formatMinutes}
          tint={accent.tint}
          accent={accent.deep}
        />

        {copy.hasGoal ? (
          <StepperField
            label="Daily goal"
            value={goal}
            onChange={setGoal}
            min={1}
            max={20}
            format={(value) => `${value} glasses`}
            tint={accent.tint}
            accent={accent.deep}
          />
        ) : null}
      </Card>

      <SectionHeader title="How it alerts you" style={styles.section} />
      <Card padded={false} style={styles.card}>
        <SettingsRow
          label="Speak the reminder"
          description="Read the sentence aloud when the device allows it"
          toggleValue={config.voiceEnabled}
          onToggle={() => patch({ voiceEnabled: !config.voiceEnabled })}
          iconTint={accent.tint}
          iconColor={accent.deep}
        />
        <SettingsRow
          label="Vibrate"
          description="A short, deliberate pattern — never continuous"
          toggleValue={config.vibrationEnabled}
          onToggle={() => patch({ vibrationEnabled: !config.vibrationEnabled })}
          iconTint={accent.tint}
          iconColor={accent.deep}
          isLast
        />
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
  stack: {
    gap: spacing.lg,
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
  },
});
