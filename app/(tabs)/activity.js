import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ListChecks } from 'lucide-react-native';

import { ActivityTimelineItem } from '../../src/components/activity/ActivityTimelineItem';
import { MiniBarChart } from '../../src/components/activity/MiniBarChart';
import { RangeNavigator } from '../../src/components/activity/RangeNavigator';
import { RangeSummary } from '../../src/components/activity/RangeSummary';
import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import {
  AnimatedSegmentedControl,
  SegmentedContent,
} from '../../src/components/common/AnimatedSegmentedControl';
import { Card } from '../../src/components/common/Card';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { getDayTimeline, getRangeSummary } from '../../src/services/activity/activityService';
import { seriesForType } from '../../src/services/analytics/aggregations';
import {
  ACTIVITY_VIEW_OPTIONS,
  ACTIVITY_VIEWS,
  buildRange,
  shiftAnchor,
  VIEW_EMPTY_COPY,
} from '../../src/services/analytics/ranges';
import { colors } from '../../src/theme/colors';
import { layout, spacing } from '../../src/theme/spacing';
import { LOG_CATEGORY, logger } from '../../src/utils/logger';

/**
 * Activity screen.
 *
 * Day is a literal timeline of `activity_logs`; the wider views aggregate the
 * same rows. Every number and bar comes from stored data — an empty range shows
 * an empty state rather than a flat chart.
 */
export default function ActivityScreen() {
  const [view, setView] = useState(ACTIVITY_VIEWS.DAY);
  const [anchor, setAnchor] = useState(() => new Date());
  const [timeline, setTimeline] = useState(null);
  const [summary, setSummary] = useState(null);

  const range = useMemo(() => buildRange(view, anchor), [view, anchor]);
  const emptyCopy = VIEW_EMPTY_COPY[view];
  const isAtPresent = !range.canGoForward;
  const isDayView = view === ACTIVITY_VIEWS.DAY;

  const load = useCallback(async () => {
    try {
      if (isDayView) {
        setTimeline(await getDayTimeline(anchor));
        setSummary(null);
      } else {
        setSummary(await getRangeSummary(view, range));
        setTimeline(null);
      }
    } catch (error) {
      logger.error(LOG_CATEGORY.ANALYTICS, 'Could not load activity', error);
      setTimeline({ items: [], completedCount: 0, totalCount: 0 });
      setSummary(null);
    }
    // `range` is derived from view+anchor, so those are the real inputs.
  }, [isDayView, view, anchor, range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const hasDayItems = isDayView && timeline?.items?.length > 0;
  const hasSummary = !isDayView && summary?.hasData;
  const chartData = hasSummary ? seriesForType(summary) : [];

  return (
    <ScreenContainer tone="activity">
      <AppHeader
        title="Activity"
        subtitle="A factual record of what you confirmed — not a score."
      />

      <AnimatedSegmentedControl
        options={ACTIVITY_VIEW_OPTIONS}
        value={view}
        onChange={(next) => {
          setView(next);
          setAnchor(new Date());
        }}
      />

      <Card style={styles.navigatorCard}>
        <RangeNavigator
          label={range.label}
          onPrevious={() => setAnchor((current) => shiftAnchor(view, current, -1))}
          onNext={() => setAnchor((current) => shiftAnchor(view, current, 1))}
          canGoForward={range.canGoForward}
          resetLabel={isAtPresent ? undefined : 'Back to now'}
          onReset={() => setAnchor(new Date())}
        />
      </Card>

      <SegmentedContent segmentKey={`${view}-${range.label}`}>
        {hasDayItems ? (
          <Card style={styles.contentCard}>
            <View style={styles.summaryRow}>
              <AppText variant="caption" color={colors.textFaint}>
                {`${timeline.totalCount} ${timeline.totalCount === 1 ? 'entry' : 'entries'}`}
              </AppText>
            </View>
            {timeline.items.map((item, index) => (
              <ActivityTimelineItem
                key={item.id}
                item={item}
                isLast={index === timeline.items.length - 1}
              />
            ))}
          </Card>
        ) : hasSummary ? (
          <View>
            <Card style={styles.contentCard}>
              <RangeSummary summary={summary} />
            </Card>

            <SectionHeader
              title="Confirmations"
              caption={view === ACTIVITY_VIEWS.YEAR ? 'By month' : 'By day'}
              style={styles.section}
            />
            <Card>
              <MiniBarChart data={chartData} />
            </Card>
          </View>
        ) : (
          <Card style={styles.contentCard}>
            <EmptyState icon={ListChecks} title={emptyCopy.title} message={emptyCopy.message} />
          </Card>
        )}
      </SegmentedContent>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navigatorCard: {
    marginTop: layout.cardGap,
    paddingVertical: spacing.md,
  },
  contentCard: {
    marginTop: layout.cardGap,
  },
  summaryRow: {
    marginBottom: spacing.base,
  },
  section: {
    marginTop: layout.sectionGap,
  },
});
