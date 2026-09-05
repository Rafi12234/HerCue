import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ListChecks } from 'lucide-react-native';

import { RangeNavigator } from '../../src/components/activity/RangeNavigator';
import { AppHeader } from '../../src/components/common/AppHeader';
import {
  AnimatedSegmentedControl,
  SegmentedContent,
} from '../../src/components/common/AnimatedSegmentedControl';
import { Card } from '../../src/components/common/Card';
import { DevelopmentNotice } from '../../src/components/common/DevelopmentNotice';
import { EmptyState } from '../../src/components/common/EmptyState';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import {
  ACTIVITY_VIEW_OPTIONS,
  ACTIVITY_VIEWS,
  buildRange,
  shiftAnchor,
  VIEW_EMPTY_COPY,
} from '../../src/services/analytics/ranges';
import { layout, spacing } from '../../src/theme/spacing';

/**
 * Activity shell.
 *
 * The segmented control and range navigation are fully working; the summaries
 * and charts stay deliberately absent until they can be driven by real stored
 * activity, because a placeholder chart would be indistinguishable from a real
 * one.
 */
export default function ActivityScreen() {
  const [view, setView] = useState(ACTIVITY_VIEWS.DAY);
  const [anchor, setAnchor] = useState(() => new Date());

  const range = useMemo(() => buildRange(view, anchor), [view, anchor]);
  const emptyCopy = VIEW_EMPTY_COPY[view];
  const isAtPresent = !range.canGoForward;

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
        <Card style={styles.contentCard}>
          <EmptyState
            icon={ListChecks}
            title={emptyCopy.title}
            message={emptyCopy.message}
          />
        </Card>
      </SegmentedContent>

      <DevelopmentNotice
        title="Summaries and charts arrive in a later update"
        message="They will be calculated from your stored activity only — no sample figures will ever be shown here."
        style={styles.notice}
      />
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
  notice: {
    marginTop: spacing.lg,
  },
});
