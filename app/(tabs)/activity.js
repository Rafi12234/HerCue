import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ListChecks } from 'lucide-react-native';

import { ActivityTimelineItem } from '../../src/components/activity/ActivityTimelineItem';
import { RangeNavigator } from '../../src/components/activity/RangeNavigator';
import { AppHeader } from '../../src/components/common/AppHeader';
import { AppText } from '../../src/components/common/AppText';
import {
  AnimatedSegmentedControl,
  SegmentedContent,
} from '../../src/components/common/AnimatedSegmentedControl';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { getDayTimeline } from '../../src/services/activity/activityService';
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
 * Day reads real rows from `activity_logs`. Week/month/year stay empty until
 * Phase 10 can aggregate them properly — a placeholder chart would be
 * indistinguishable from a real one.
 */
export default function ActivityScreen() {
  const [view, setView] = useState(ACTIVITY_VIEWS.DAY);
  const [anchor, setAnchor] = useState(() => new Date());
  const [timeline, setTimeline] = useState(null);

  const range = useMemo(() => buildRange(view, anchor), [view, anchor]);
  const emptyCopy = VIEW_EMPTY_COPY[view];
  const isAtPresent = !range.canGoForward;
  const isDayView = view === ACTIVITY_VIEWS.DAY;

  const loadDay = useCallback(async () => {
    if (!isDayView) return;
    try {
      setTimeline(await getDayTimeline(anchor));
    } catch (error) {
      logger.error(LOG_CATEGORY.ANALYTICS, 'Could not load the day timeline', error);
      setTimeline({ items: [], completedCount: 0, totalCount: 0 });
    }
  }, [isDayView, anchor]);

  // Re-runs on first focus and whenever the anchor or view changes.
  useFocusEffect(
    useCallback(() => {
      loadDay();
    }, [loadDay])
  );

  const hasDayItems = isDayView && timeline?.items?.length > 0;

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
            <View style={styles.summary}>
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
        ) : (
          <Card style={styles.contentCard}>
            <EmptyState icon={ListChecks} title={emptyCopy.title} message={emptyCopy.message} />
          </Card>
        )}
      </SegmentedContent>

      {isDayView ? null : (
        <DevelopmentNotice
          title="Summaries and charts arrive in a later update"
          message="They will be calculated from your stored activity only — no sample figures will ever be shown here."
          style={styles.notice}
        />
      )}
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
  summary: {
    marginBottom: spacing.base,
  },
  notice: {
    marginTop: spacing.lg,
  },
});
