function expandCronField(field: string): number[] {
  const results: number[] = [];

  for (const part of field.split(',')) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i += 1) results.push(i);
    } else if (part !== '*') {
      results.push(Number(part));
    }
  }

  return results;
}

export function isCron(str: string): boolean {
  const parts = str.trim().split(/\s+/);
  return parts.length === 5;
}

export function isRRule(str: string): boolean {
  return str.startsWith('RRULE:') || str.startsWith('FREQ=');
}

export function cronToRRule(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  const [minute, hour, dom, _month, dow] = parts;

  const dayMap: Record<string, string> = {
    '0': 'SU',
    '1': 'MO',
    '2': 'TU',
    '3': 'WE',
    '4': 'TH',
    '5': 'FR',
    '6': 'SA',
    '7': 'SU'
  };

  const rruleParts: string[] = [];

  if (dow !== '*' && dom === '*') {
    rruleParts.push('FREQ=WEEKLY');
    const days = expandCronField(dow)
      .map((day) => dayMap[String(day)] || '')
      .filter(Boolean);
    if (days.length > 0) rruleParts.push('BYDAY=' + days.join(','));
  } else if (dom !== '*') {
    rruleParts.push('FREQ=MONTHLY');
    rruleParts.push('BYMONTHDAY=' + dom);
  } else {
    rruleParts.push('FREQ=DAILY');
  }

  if (hour !== '*') rruleParts.push('BYHOUR=' + hour);
  if (minute !== '*') rruleParts.push('BYMINUTE=' + minute);

  return 'RRULE:' + rruleParts.join(';');
}

export function rruleToCron(rruleStr: string): string {
  const str = rruleStr.replace('RRULE:', '');
  const params = Object.fromEntries(
    str.split(';').map((part) => {
      const [key, value = ''] = part.split('=');
      return [key, value];
    })
  ) as Record<string, string>;

  const minute = params.BYMINUTE || '0';
  const hour = params.BYHOUR || '*';
  const dom = params.BYMONTHDAY || '*';
  const month = '*';

  const rruleDayMap: Record<string, string> = {
    MO: '1',
    TU: '2',
    WE: '3',
    TH: '4',
    FR: '5',
    SA: '6',
    SU: '0'
  };

  let dow = '*';
  if (params.BYDAY) {
    dow = params.BYDAY.split(',').map((day) => rruleDayMap[day] || day).join(',');
  }

  return minute + ' ' + hour + ' ' + dom + ' ' + month + ' ' + dow;
}
