import {
  applyQuietHours,
  isWithinQuietHours,
  nextFixedIntervalSlot,
  nextFromLastCompletion,
  planNextCheck,
} from '../src/services/reminder/intervalPlanner';

const at = (iso) => new Date(iso);

describe('nextFromLastCompletion', () => {
  it('anchors the next check to the actual confirmation, not a clock slot', () => {
    expect(nextFromLastCompletion(at('2026-09-06T08:15:00'), 360)).toEqual(
      at('2026-09-06T14:15:00')
    );
  });

  it('follows the confirmation when it moves', () => {
    expect(nextFromLastCompletion(at('2026-09-06T14:42:00'), 360)).toEqual(
      at('2026-09-06T20:42:00')
    );
  });

  it('has no answer without an anchor', () => {
    expect(nextFromLastCompletion(null, 360)).toBeNull();
  });
});

describe('isWithinQuietHours', () => {
  const quietHours = { enabled: true, start: '22:30', end: '07:30' };

  it('detects a time in the late-evening part of a window that wraps midnight', () => {
    expect(isWithinQuietHours(at('2026-09-06T23:10:00'), quietHours)).toBe(true);
  });

  it('detects a time in the early-morning tail', () => {
    expect(isWithinQuietHours(at('2026-09-06T05:00:00'), quietHours)).toBe(true);
  });

  it('leaves daytime alone', () => {
    expect(isWithinQuietHours(at('2026-09-06T14:00:00'), quietHours)).toBe(false);
  });

  it('is inert when disabled', () => {
    expect(isWithinQuietHours(at('2026-09-06T23:10:00'), { ...quietHours, enabled: false })).toBe(
      false
    );
  });
});

describe('applyQuietHours', () => {
  const quietHours = { enabled: true, start: '22:30', end: '07:30' };

  it('defers a late-night reminder to the morning the window ends', () => {
    expect(applyQuietHours(at('2026-09-06T23:10:00'), quietHours)).toEqual(
      at('2026-09-07T07:30:00')
    );
  });

  it('defers an early-morning reminder to later the same morning', () => {
    expect(applyQuietHours(at('2026-09-06T05:00:00'), quietHours)).toEqual(
      at('2026-09-06T07:30:00')
    );
  });

  it('leaves a daytime reminder untouched', () => {
    expect(applyQuietHours(at('2026-09-06T14:00:00'), quietHours)).toEqual(
      at('2026-09-06T14:00:00')
    );
  });
});

describe('planNextCheck', () => {
  it('adds the six-hour food interval to the recorded meal', () => {
    const result = planNextCheck({
      lastCompletedAt: at('2026-09-06T08:15:00'),
      intervalMinutes: 360,
    });
    expect(result.at).toEqual(at('2026-09-06T14:15:00'));
    expect(result.deferredByQuietHours).toBe(false);
  });

  it('applies the bathroom interval from the last confirmed visit', () => {
    const result = planNextCheck({
      lastCompletedAt: at('2026-09-06T10:00:00'),
      intervalMinutes: 180,
    });
    expect(result.at).toEqual(at('2026-09-06T13:00:00'));
  });

  it('reports when quiet hours moved the result', () => {
    const result = planNextCheck({
      lastCompletedAt: at('2026-09-06T18:00:00'),
      intervalMinutes: 360,
      quietHours: { enabled: true, start: '22:30', end: '07:30' },
    });
    expect(result.at).toEqual(at('2026-09-07T07:30:00'));
    expect(result.deferredByQuietHours).toBe(true);
  });

  it('returns nothing rather than inventing an anchor', () => {
    expect(planNextCheck({ lastCompletedAt: null, intervalMinutes: 360 }).at).toBeNull();
  });
});

describe('nextFixedIntervalSlot', () => {
  const config = { activeStartTime: '08:00', activeEndTime: '22:00', intervalMinutes: 120 };

  it('finds the next slot on the grid', () => {
    expect(nextFixedIntervalSlot({ ...config, from: at('2026-09-06T09:10:00') })).toEqual(
      at('2026-09-06T10:00:00')
    );
  });

  it('returns the first slot of the day before the window opens', () => {
    expect(nextFixedIntervalSlot({ ...config, from: at('2026-09-06T06:00:00') })).toEqual(
      at('2026-09-06T08:00:00')
    );
  });

  it('rolls over to tomorrow once the window has closed', () => {
    expect(nextFixedIntervalSlot({ ...config, from: at('2026-09-06T23:00:00') })).toEqual(
      at('2026-09-07T08:00:00')
    );
  });

  it('treats an inverted window as unset rather than looping', () => {
    expect(
      nextFixedIntervalSlot({
        activeStartTime: '22:00',
        activeEndTime: '08:00',
        intervalMinutes: 120,
        from: at('2026-09-06T12:00:00'),
      })
    ).toBeNull();
  });
});
