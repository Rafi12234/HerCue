import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
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
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SettingsRow } from '../../src/components/common/SettingsRow';
import { SettingsSection } from '../../src/components/settings/SettingsSection';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { spacing } from '../../src/theme/spacing';
import { formatScheduleTime } from '../../src/utils/dates';
import { useAppStore } from '../../src/stores/appStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import {
  EXACT_ALARM_STATUS,
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
  const permissions = useAppStore((state) => state.permissions);
  const refreshPermissions = useAppStore((state) => state.refreshPermissions);
  const settings = useSettingsStore();
  const [isRequesting, setIsRequesting] = useState(false);

  // Permission can change in system settings while the app is backgrounded.
  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
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
        caption="Each reminder gets its own settings screen as its module is built."
      >
        <SettingsRow
          icon={Droplet}
          label="Water"
          description="Interval, active hours and daily goal"
          state="soon"
          iconTint={categoryColors.WATER.tint}
          iconColor={categoryColors.WATER.deep}
        />
        <SettingsRow
          icon={Pill}
          label="Medicine"
          description="Add medicines, times and repeat days"
          state="soon"
          iconTint={categoryColors.MEDICINE.tint}
          iconColor={categoryColors.MEDICINE.deep}
        />
        <SettingsRow
          icon={UtensilsCrossed}
          label="Food"
          description="Six-hour check, measured from your last meal"
          state="soon"
          iconTint={categoryColors.FOOD.tint}
          iconColor={categoryColors.FOOD.deep}
        />
        <SettingsRow
          icon={Bath}
          label="Bathroom"
          description="Interval and active hours"
          state="soon"
          iconTint={categoryColors.BATHROOM.tint}
          iconColor={categoryColors.BATHROOM.deep}
        />
        <SettingsRow
          icon={CalendarHeart}
          label="Period reminders"
          description="Gentle notes before an expected date"
          state="soon"
          iconTint={categoryColors.PERIOD.tint}
          iconColor={categoryColors.PERIOD.deep}
          isLast
        />
      </SettingsSection>

      <SettingsSection
        title="Reminder behaviour"
        caption="Saved for this session only until settings storage is switched on."
      >
        <SettingsRow
          icon={Volume2}
          label="Spoken reminders"
          description="Read the reminder sentence aloud when the device allows it"
          toggleValue={settings.voiceEnabled}
          onToggle={() => settings.toggle('voiceEnabled')}
        />
        <SettingsRow
          icon={Vibrate}
          label="Reminder vibration"
          description="A short, deliberate pattern — never continuous"
          toggleValue={settings.vibrationEnabled}
          onToggle={() => settings.toggle('vibrationEnabled')}
        />
        <SettingsRow
          icon={MoonStar}
          label="Quiet hours"
          description="Hold back water, food and bathroom reminders overnight"
          toggleValue={settings.quietHoursEnabled}
          onToggle={() => settings.toggle('quietHoursEnabled')}
        />
        <SettingsRow
          icon={Clock3}
          label="Quiet hours window"
          value={`${formatScheduleTime(settings.quietHoursStart)} – ${formatScheduleTime(
            settings.quietHoursEnd
          )}`}
          description="Editable once reminder scheduling is in place"
          state="soon"
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
            permissions?.exactAlarms === EXACT_ALARM_STATUS.UNKNOWN
              ? 'Precise reminders need Android’s Alarms & reminders access. HerCue will check and guide you once the alarm engine is added.'
              : 'Precise reminders need Android’s Alarms & reminders access.'
          }
          value="Not checked"
          state="soon"
        />
        <SettingsRow
          icon={ExternalLink}
          label="System notification settings"
          description="Sound, importance and lock-screen visibility are controlled by Android"
          onPress={() => permissionService.openSystemSettings()}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <SettingsRow
          icon={Palette}
          label="Theme"
          value="Light"
          description="A dark theme will only ship at the same quality as the light one"
          state="soon"
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
          description="Available once there is stored history to remove"
          state="soon"
          isLast
        />
      </SettingsSection>

      <DevelopmentNotice
        title="Some settings are still being built"
        message="Rows marked “Soon” are shown so nothing here pretends to work before it does."
      />
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
