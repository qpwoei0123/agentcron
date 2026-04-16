import { describe, expect, it } from 'vitest';
import { cronToRRule, isCron, isRRule, rruleToCron } from '../src/core/schedule.js';

describe('schedule detection', () => {
  it('detects cron expressions', () => {
    expect(isCron('0 9 * * 1-5')).toBe(true);
    expect(isCron('*/5 * * * *')).toBe(true);
    expect(isCron('RRULE:FREQ=DAILY')).toBe(false);
  });

  it('detects RRULE expressions', () => {
    expect(isRRule('RRULE:FREQ=WEEKLY;BYHOUR=9')).toBe(true);
    expect(isRRule('FREQ=DAILY')).toBe(true);
    expect(isRRule('0 9 * * *')).toBe(false);
  });
});

describe('cron to RRULE', () => {
  it('converts weekday schedule', () => {
    const result = cronToRRule('0 9 * * 1-5');
    expect(result).toContain('FREQ=WEEKLY');
    expect(result).toContain('BYHOUR=9');
    expect(result).toContain('BYMINUTE=0');
    expect(result).toContain('BYDAY=');
  });

  it('converts daily schedule', () => {
    const result = cronToRRule('0 6 * * *');
    expect(result).toContain('FREQ=DAILY');
    expect(result).toContain('BYHOUR=6');
  });
});

describe('RRULE to cron', () => {
  it('converts weekly RRULE', () => {
    const result = rruleToCron('RRULE:FREQ=WEEKLY;BYHOUR=9;BYMINUTE=0;BYDAY=MO,TU,WE,TH,FR');
    expect(result).toBe('0 9 * * 1,2,3,4,5');
  });

  it('converts daily RRULE', () => {
    const result = rruleToCron('RRULE:FREQ=DAILY;BYHOUR=6;BYMINUTE=30');
    expect(result).toBe('30 6 * * *');
  });
});
