import { useCallback, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';

import { AppText } from '../../src/components/common/AppText';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { HomeHeader } from '../../src/components/home/HomeHeader';
import { IntervalCareCard } from '../../src/components/home/IntervalCareCard';
import { MedicineCard } from '../../src/components/home/MedicineCard';
import { NextReminderCard } from '../../src/components/home/NextReminderCard';
import { PeriodCard } from '../../src/components/home/PeriodCard';
import { WaterCard } from '../../src/components/home/WaterCard';
import { REMINDER_TYPES } from '../../src/constants/reminderTypes';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useEntrance, useMarkEntranceComplete } from '../../src/hooks/useEntrance';
import { careActions } from '../../src/services/care/careActions';
import { colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';

const SCREEN_KEY = 'home';

/** Wraps a card so it participates in the staggered first-load entrance. */
function EntranceItem({ index, children, style }) {
  const animatedStyle = useEntrance(SCREEN_KEY, index);
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, isPreview, nextReminder, waterProgress, refresh } = useDashboard();

  const scrollRef = useRef(null);
  const cardOffsets = useRef({});
  const [highlights, setHighlights] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useMarkEntranceComplete(SCREEN_KEY);

  // Water count rolls over at local midnight and other tabs can log activity,
  // so the projection is re-read whenever Home comes back into view.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const rememberOffset = useCallback(
    (type) => (event) => {
      cardOffsets.current[type] = event.nativeEvent.layout.y;
    },
    []
  );

  // The hero has no detail screen yet, so it answers by pointing at the card it
  // refers to instead of navigating somewhere unfinished.
  const revealCard = useCallback((type) => {
    const y = cardOffsets.current[type];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
    }
    setHighlights((current) => ({ ...current, [type]: (current[type] ?? 0) + 1 }));
  }, []);

  return (
    <ScreenContainer
      tone="home"
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accentDeep}
          colors={[colors.accentDeep]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <HomeHeaderSection isPreview={isPreview} />

      <EntranceItem index={0}>
        <NextReminderCard
          reminder={nextReminder}
          onPress={nextReminder ? () => revealCard(nextReminder.type) : undefined}
        />
      </EntranceItem>

      <SectionHeader
        title="Today's care"
        caption="A quick look at how the day is going"
        style={styles.sectionHeader}
      />

      <View style={styles.stack}>
        <EntranceItem index={1}>
          <View onLayout={rememberOffset(REMINDER_TYPES.WATER)}>
            <WaterCard
              water={data.water}
              progress={waterProgress}
              onDrink={careActions.drinkWater}
              highlightTrigger={highlights[REMINDER_TYPES.WATER]}
            />
          </View>
        </EntranceItem>

        <EntranceItem index={2}>
          <View onLayout={rememberOffset(REMINDER_TYPES.MEDICINE)}>
            <MedicineCard
              medicine={data.medicine}
              onOpenList={() => router.push('/medicine')}
              highlightTrigger={highlights[REMINDER_TYPES.MEDICINE]}
            />
          </View>
        </EntranceItem>

        <View style={styles.row}>
          <EntranceItem index={3} style={styles.rowItem}>
            <View onLayout={rememberOffset(REMINDER_TYPES.FOOD)}>
              <IntervalCareCard
                type={REMINDER_TYPES.FOOD}
                title="Food"
                actionLabel="I ate"
                lastConfirmedAt={data.food.lastConfirmedAt}
                nextAt={data.food.nextCheckAt}
                enabled={data.food.enabled}
                emptyLabel="No meal recorded yet"
                onConfirm={careActions.eat}
                highlightTrigger={highlights[REMINDER_TYPES.FOOD]}
              />
            </View>
          </EntranceItem>

          <EntranceItem index={4} style={styles.rowItem}>
            <View onLayout={rememberOffset(REMINDER_TYPES.BATHROOM)}>
              <IntervalCareCard
                type={REMINDER_TYPES.BATHROOM}
                title="Bathroom"
                actionLabel="I went"
                lastConfirmedAt={data.bathroom.lastConfirmedAt}
                nextAt={data.bathroom.nextReminderAt}
                enabled={data.bathroom.enabled}
                emptyLabel="Nothing recorded yet"
                onConfirm={careActions.visitBathroom}
                highlightTrigger={highlights[REMINDER_TYPES.BATHROOM]}
              />
            </View>
          </EntranceItem>
        </View>

        <EntranceItem index={5}>
          <View onLayout={rememberOffset(REMINDER_TYPES.PERIOD)}>
            <PeriodCard
              period={data.period}
              onOpenPeriod={() => router.push('/period')}
              highlightTrigger={highlights[REMINDER_TYPES.PERIOD]}
            />
          </View>
        </EntranceItem>
      </View>

      <EntranceItem index={6}>
        <AppText variant="caption" align="center" color={colors.textFaint} style={styles.footer}>
          Take it gently today ✨
        </AppText>
      </EntranceItem>
    </ScreenContainer>
  );
}

function HomeHeaderSection({ isPreview }) {
  const animatedStyle = useEntrance(SCREEN_KEY, 0);
  return (
    <Animated.View style={animatedStyle}>
      <HomeHeader showPreviewBadge={isPreview} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: layout.sectionGap,
  },
  stack: {
    gap: layout.cardGap,
  },
  row: {
    flexDirection: 'row',
    gap: layout.cardGap,
  },
  rowItem: {
    flex: 1,
    minWidth: 0,
  },
  footer: {
    marginTop: layout.sectionGap,
    marginBottom: spacing.sm,
  },
});
