import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus, Trash, X } from 'lucide-react-native';

import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import { Card } from '../../src/components/common/Card';
import { IconButton } from '../../src/components/common/IconButton';
import { PressableScale } from '../../src/components/common/PressableScale';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { DayOfWeekField } from '../../src/components/form/DayOfWeekField';
import { TextField } from '../../src/components/form/TextField';
import { TimeField } from '../../src/components/form/TimeField';
import { archive, loadMedicine, saveMedicine } from '../../src/services/medicine/medicineService';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import { categoryColors, colors } from '../../src/theme/colors';
import { radii } from '../../src/theme/radii';
import { layout, spacing } from '../../src/theme/spacing';
import { formatScheduleTime } from '../../src/utils/dates';

const accent = categoryColors.MEDICINE;

export default function MedicineFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const medicineId = id ? String(id) : null;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState(['09:00']);
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!medicineId) return;
    (async () => {
      const medicine = await loadMedicine(medicineId);
      if (!medicine) return;

      setName(medicine.name ?? '');
      setDosage(medicine.dosage ?? '');
      setInstructions(medicine.instructions ?? '');
      setTimes(medicine.schedules.map((schedule) => schedule.timeOfDay).sort());
      setDaysOfWeek(medicine.schedules[0]?.daysOfWeek ?? []);
    })();
  }, [medicineId]);

  const updateTime = (index, value) => {
    setTimes((current) => current.map((time, position) => (position === index ? value : time)));
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setErrors({});

    const result = await saveMedicine({
      id: medicineId,
      name,
      dosage,
      instructions,
      times,
      daysOfWeek,
    });

    setSaving(false);

    if (!result.ok) {
      setErrors(result.errors ?? {});
      if (result.message) Alert.alert('Couldn’t save', result.message);
      return;
    }

    await useDashboardStore.getState().refresh();
    router.back();
  }, [saving, medicineId, name, dosage, instructions, times, daysOfWeek, router]);

  const handleArchive = useCallback(() => {
    if (!medicineId) return;

    Alert.alert(
      `Remove ${name || 'this medicine'}?`,
      'Future reminders stop. Everything you already recorded stays in your history.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await archive(medicineId);
            await useDashboardStore.getState().refresh();
            router.back();
          },
        },
      ]
    );
  }, [medicineId, name, router]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer tone="home">
        <View style={styles.backRow}>
          <IconButton icon={X} onPress={() => router.back()} accessibilityLabel="Close" />
        </View>

        <AppHeader
          title={medicineId ? 'Edit medicine' : 'Add a medicine'}
          subtitle="HerCue repeats exactly what you enter — it never invents a dose."
        />

        <Card style={styles.stack}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Napa"
            error={errors.name}
            autoFocus={!medicineId}
          />
          <TextField
            label="Dose (optional)"
            value={dosage}
            onChangeText={setDosage}
            placeholder="1 tablet"
          />
          <TextField
            label="Instructions (optional)"
            value={instructions}
            onChangeText={setInstructions}
            placeholder="After food"
            helper="Spoken aloud with the reminder, exactly as written."
          />
        </Card>

        <SectionHeader
          title="Times"
          caption={`${times.length} a day`}
          style={styles.section}
        />
        <Card style={styles.stack}>
          {times.map((time, index) => (
            <View key={`${time}-${index}`} style={styles.timeRow}>
              <View style={styles.timeField}>
                <TimeField
                  value={time}
                  onChange={(value) => updateTime(index, value)}
                  tint={accent.tint}
                  accent={accent.deep}
                />
              </View>
              {times.length > 1 ? (
                <IconButton
                  icon={Trash}
                  onPress={() => setTimes((current) => current.filter((_, i) => i !== index))}
                  accessibilityLabel={`Remove ${formatScheduleTime(time)}`}
                />
              ) : null}
            </View>
          ))}

          {errors.times ? (
            <AppText variant="caption" color={colors.ember}>
              {errors.times}
            </AppText>
          ) : null}

          <PressableScale
            onPress={() => setTimes((current) => [...current, '21:00'])}
            haptic="press"
            scaleTo={0.97}
            style={[styles.addTime, { backgroundColor: accent.tint }]}
          >
            <Plus size={15} color={accent.deep} strokeWidth={2.6} />
            <AppText variant="button" color={accent.deep}>
              Add another time
            </AppText>
          </PressableScale>
        </Card>

        <SectionHeader title="Repeat" style={styles.section} />
        <Card>
          <DayOfWeekField
            value={daysOfWeek}
            onChange={setDaysOfWeek}
            tint={accent.tint}
            accent={accent.base}
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
            {saving ? 'Saving…' : 'Save medicine'}
          </AppText>
        </PressableScale>

        {medicineId ? (
          <PressableScale
            onPress={handleArchive}
            haptic="press"
            scaleTo={0.97}
            style={styles.remove}
          >
            <AppText variant="button" color={colors.ember}>
              Remove medicine
            </AppText>
          </PressableScale>
        ) : null}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  stack: {
    gap: spacing.lg,
  },
  section: {
    marginTop: layout.sectionGap,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeField: {
    flex: 1,
    minWidth: 0,
  },
  addTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    borderRadius: radii.pill,
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
  remove: {
    alignItems: 'center',
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
  },
});
