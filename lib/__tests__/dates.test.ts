import { isGroupEventDiscussionReadOnly, isGroupEventPast } from '@/lib/dates';

describe('isGroupEventDiscussionReadOnly', () => {
  it('returns true when event is cancelled', () => {
    expect(
      isGroupEventDiscussionReadOnly({
        status: 'cancelled',
        startsAt: '2099-01-01T00:00:00.000Z',
      })
    ).toBe(true);
  });

  it('returns false when active and start is in the future', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isGroupEventDiscussionReadOnly({ status: 'active', startsAt: future })).toBe(false);
  });

  it('returns false when active even if start is in the past', () => {
    expect(
      isGroupEventDiscussionReadOnly({
        status: 'active',
        startsAt: '2000-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });
});

describe('isGroupEventPast', () => {
  it('returns false when start is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isGroupEventPast(future)).toBe(false);
  });

  it('returns true when start is in the past', () => {
    expect(isGroupEventPast('2000-01-01T00:00:00.000Z')).toBe(true);
  });
});
