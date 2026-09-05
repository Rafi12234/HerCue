import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bath,
  BellRing,
  CalendarHeart,
  Clock3,
  Database,
  Droplet,
  ExternalLink,
  MoonStar,
  Palette,
  Pill,
  ShieldCheck,
  SunMoon,
  Trash,
  UtensilsCrossed,
  Vibrate,
  Volume2,
} from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { SettingsSection } from '../../src/components/settings/SettingsSection';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { spacing } from '../../src/theme/spacing';
import { formatScheduleTime } from '../../src/utils/dates';
import { useAppStore } from '../../src/stores/appStore';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { resetDatabase } from '../../src/database/db';
import { reminderScheduler } from '../../src/services/reminder/reminderScheduler';
import { seedDefaults } from '../../src/services/settings/settingsService';
import {
  PERMISSION_STATUS,
  permissionService,
} from '../../src/services/permissions/permissionService';

const PERMISSION_COPY = {
  [PERMISSION_STATUS.GRANTED]: {
    label: 'Allowed',
    description: 'HerCue can remind you even when the app is closed.',
  },
  [PERMISSION_STATUS.DENIED]: {
    label: 'Turned off',
    description:
      'Notifications are turned off. Enable them so I can remind you at the right time.',
  },
  [PERMISSION_STATUS.UNDETERMINED]: {
    label: 'Not set',
    description: 'Allow notifications so I can remind you even when the app isn’t open.',
  },
  [PERMISSION_STATUS.UNSUPPORTED]: {
    label: 'Unavailable',
    description: 'Reminders need a device build of HerCue.',
  },
};

export default function SettingsScreen() {
  const router = useRouter();
  const permissions = useAppStore((state) => state.permissions);
  const refreshPermissions = useAppStore((state) => state.refreshPermissions);
  const settings = useSettingsStore();
  const [isRequesting, setIsRequesting] = useState(false);
  const [canScheduleExact, setCanScheduleExact] = useState(false);
  const [testState, setTestState] = useState('idle');

  // Permission can change in system settings while the app is backgrounded.
  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
      reminderScheduler.canScheduleExact().then(setCanScheduleExact);
    }, [refreshPermissions])
  );

  useEffect(() => {
    if (!permissions) refreshPermissions();
  }, [permissions, refreshPermissions]);

  const notificationStatus = permissions?.notifications ?? PERMISSION_STATUS.UNDETERMINED;
  const permissionCopy = PERMISSION_COPY[notificationStatus] ?? PERMISSION_COPY.UNDETERMINED;
  const needsPermission = notificationStatus !== PERMISSION_STATUS.GRANTED;

  const handleNotificationPress = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      if (notificationStatus === PERMISSION_STATUS.UNDETERMINED) {
        await permissionService.requestNotifications();
      } else {
        await permissionService.openSystemSettings();
      }
      await refreshPermissions();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleExactAlarmPress = useCallback(async () => {
    await reminderScheduler.openAlarmSettings();
    setCanScheduleExact(await reminderScheduler.canScheduleExact());
  }, []);

  const handleTestReminder = useCallback(async () => {
    const result = await reminderScheduler.testReminder(5);

    if (!result.ok) {
      Alert.alert('Test reminder unavailable', result.message ?? 'This build cannot send reminders.');
      return;
    }

    setTestState('sent');
    setTimeout(() => setTestState('idle'), 12000);
  }, []);

  // Destructive and irreversible, so it states exactly what goes and asks twice
  // over (`docs/06_DATABASE_AND_DATA_MODEL.md` §10).
  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear all data?',
      'This will remove your reminders, history, medicines and period records from this device. It cannot be undone.',
      [
        { text: 'Keep my data', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Alarms first: clearing the database would otherwise leave the
              // native layer holding orphaned alarms with no matching rows.
              await reminderScheduler.cancelAll();
              await resetDatabase();
              await seedDefaults();
              await useSettingsStore.getState().hydrate();
              await useDashboardStore.getState().hydrate();
            } catch {
              Alert.alert('Couldn’t clear your data', 'Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  return (
    <ScreenContainer tone="settings">
      <AppHeader title="Settings" subtitle="Everything stays on this device." />

      {needsPermission ? (
        <Card tint={colors.accentSoft} style={styles.prompt}>
          <View style={styles.promptRow}>
            <View style={styles.promptIcon}>
              <BellRing size={18} color={colors.accentDeep} strokeWidth={2.2} />
            </View>
            <View style={styles.promptText}>
              <AppText variant="h3">Let HerCue reach you</AppText>
              <AppText variant="caption" style={styles.promptCaption}>
                {permissionCopy.description}
              </AppText>
            </View>
          </View>

          <PressableScale
            onPress={handleNotificationPress}
            disabled={isRequesting}
            scaleTo={0.96}
            haptic="press"
            style={styles.promptButton}
          >
            <AppText variant="button" color="#FFFFFF">
              {notificationStatus === PERMISSION_STATUS.UNDETERMINED
                ? 'Allow notifications'
                : 'Open notification settings'}
            </AppText>
          </PressableScale>
        </Card>
      ) : null}

      <SettingsSection
        title="Reminder preferences"
        caption="Timing, active hours and how each reminder alerts you."
      >
        <SettingsRow
          icon={Droplet}
          label="Water"
          description="Interval, active hours and daily goal"
          onPress={() => router.push('/settings/reminder/water')}
          iconTint={categoryColors.WATER.tint}
          iconColor={categoryColors.WATER.deep}
        />
        <SettingsRow
          icon={Pill}
          label="Medicine"
          description="Add medicines, times and repeat days"
          onPress={() => router.push('/medicine')}
          iconTint={categoryColors.MEDICINE.tint}
          iconColor={categoryColors.MEDICINE.deep}
        />
        <SettingsRow
          icon={UtensilsCrossed}
          label="Food"
          description="Six-hour check, measured from your last meal"
          onPress={() => router.push('/settings/reminder/food')}
          iconTint={categoryColors.FOOD.tint}
          iconColor={categoryColors.FOOD.deep}
        />
        <SettingsRow
          icon={Bath}
          label="Bathroom"
          description="Interval and active hours"
          onPress={() => router.push('/settings/reminder/bathroom')}
          iconTint={categoryColors.BATHROOM.tint}
          iconColor={categoryColors.BATHROOM.deep}
        />
        <SettingsRow
          icon={CalendarHeart}
          label="Period reminders"
          description="Which nudges you get, when they arrive, and your cycle length"
          value={settings.periodRemindersEnabled ? 'On' : 'Off'}
          onPress={() => router.push('/settings/period')}
          iconTint={categoryColors.PERIOD.tint}
          iconColor={categoryColors.PERIOD.deep}
          isLast
        />
      </SettingsSection>

      <SettingsSection
        title="Reminder behaviour"
        caption="Saved on this device."
      >
        <SettingsRow
          icon={Volume2}
          label="Spoken reminders"
          description="Read the reminder sentence aloud when the device allows it"
          toggleValue={settings.voiceEnabled}
          onToggle={settings.toggleVoice}
        />
        <SettingsRow
          icon={Vibrate}
          label="Reminder vibration"
          description="A short, deliberate pattern — never continuous"
          toggleValue={settings.vibrationEnabled}
          onToggle={settings.toggleVibration}
        />
        <SettingsRow
          icon={MoonStar}
          label="Quiet hours"
          description="Hold back water, food and bathroom reminders overnight"
          toggleValue={settings.quietHoursEnabled}
          onToggle={settings.toggleQuietHours}
        />
        <SettingsRow
          icon={Clock3}
          label="Quiet hours window"
          value={`${formatScheduleTime(settings.quietHoursStart)} – ${formatScheduleTime(
            settings.quietHoursEnd
          )}`}
          description="When water, food and bathroom reminders should wait"
          onPress={() => router.push('/settings/quiet-hours')}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Permissions">
        <SettingsRow
          icon={BellRing}
          label="Notifications"
          description={permissionCopy.description}
          value={permissionCopy.label}
          onPress={handleNotificationPress}
        />
        <SettingsRow
          icon={ShieldCheck}
          label="Alarms & reminders"
          description={
            canScheduleExact
              ? 'Reminders can fire at the exact minute you chose.'
              : 'Without this, Android may deliver reminders a few minutes late to save battery.'
          }
          value={canScheduleExact ? 'Allowed' : 'Limited'}
          onPress={handleExactAlarmPress}
        />
        <SettingsRow
          icon={ExternalLink}
          label="System notification settings"
          description={
            permissions?.channels?.blocked?.length
              ? `Muted in Android: ${permissions.channels.blocked.join(', ')}`
              : 'Sound, importance and lock-screen visibility are controlled by Android'
          }
          value={permissions?.channels?.blocked?.length ? 'Needs attention' : undefined}
          onPress={() => permissionService.openSystemSettings()}
        />
        <SettingsRow
          icon={Volume2}
          label="Spoken reminders"
          description={
            permissions?.voiceAvailable
              ? 'Text-to-speech is available on this device'
              : 'Text-to-speech isn’t available here — notifications still work'
          }
          value={permissions?.voiceAvailable ? 'Ready' : 'Unavailable'}
        />
        <SettingsRow
          icon={Vibrate}
          label="Vibration"
          description={
            permissions?.vibrationAvailable
              ? 'This device has a vibration motor'
              : 'No vibration motor detected'
          }
          value={permissions?.vibrationAvailable ? 'Ready' : 'Unavailable'}
        />
        <SettingsRow
          icon={BellRing}
          label="Test reminder"
          description={
            testState === 'sent'
              ? 'Sent — it should arrive in about five seconds.'
              : 'Fires a real reminder in five seconds so you can check this device'
          }
          value={testState === 'sent' ? 'On its way' : undefined}
          onPress={handleTestReminder}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsRow
          icon={Palette}
          label="Theme"
          value="Light"
          description="HerCue uses a single warm light theme"
        />
        <SettingsRow
          icon={SunMoon}
          label="Reduced motion"
          description="Following your Android accessibility setting"
          value={settings.reduceMotion ? 'On' : 'Off'}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          icon={Database}
          label="App version"
          value={Constants.expoConfig?.version ?? '1.0.0'}
          description="Everything is stored locally — nothing leaves this device"
        />
        <SettingsRow
          icon={Trash}
          label="Clear all data"
          description="Removes your reminders, history and period records from this device"
          onPress={handleClearData}
          destructive
          isLast
        />
      </SettingsSection>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  prompt: {
    marginBottom: spacing.xl,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  promptIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  promptText: {
    flex: 1,
    minWidth: 0,
  },
  promptCaption: {
    marginTop: 2,
  },
  promptButton: {
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
});
