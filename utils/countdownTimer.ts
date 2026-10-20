export interface CountdownTime {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 1 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonths[month];
}

export function calculateCountdown(unlockDate: Date): CountdownTime {
  const now = new Date();
  
  if (unlockDate <= now) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let years = 0;
  let months = 0;
  let days = 0;

  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  let currentDay = now.getDate();

  const targetYear = unlockDate.getFullYear();
  const targetMonth = unlockDate.getMonth();
  const targetDay = unlockDate.getDate();

  // Calculate years
  while (currentYear < targetYear) {
    const nextYear = currentYear + 1;
    const nextDate = new Date(nextYear, currentMonth, currentDay);
    if (nextDate <= unlockDate) {
      years++;
      currentYear = nextYear;
    } else {
      break;
    }
  }

  // Calculate months
  while (currentMonth < 11 || currentYear < targetYear) {
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    // Handle day overflow (e.g., Jan 31 + 1 month)
    const daysInNextMonth = getDaysInMonth(nextYear, nextMonth);
    const dayToUse = Math.min(currentDay, daysInNextMonth);
    
    const nextDate = new Date(nextYear, nextMonth, dayToUse);
    if (nextDate <= unlockDate) {
      months++;
      currentMonth = nextMonth;
      currentYear = nextYear;
    } else {
      break;
    }
  }

  // Calculate days
  while (true) {
    const nextDay = currentDay + 1;
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    
    if (nextDay > daysInCurrentMonth) {
      break;
    }

    const nextDate = new Date(currentYear, currentMonth, nextDay);
    if (nextDate <= unlockDate) {
      days++;
      currentDay = nextDay;
    } else {
      break;
    }
  }

  // Calculate remaining time in milliseconds
  const currentDateTime = new Date(currentYear, currentMonth, currentDay, 
                                   now.getHours(), now.getMinutes(), now.getSeconds());
  const diff = unlockDate.getTime() - currentDateTime.getTime();

  let hours = Math.floor(diff / (1000 * 60 * 60));
  let remaining = diff - hours * (1000 * 60 * 60);

  let minutes = Math.floor(remaining / (1000 * 60));
  remaining -= minutes * (1000 * 60);

  let seconds = Math.floor(remaining / 1000);

  return { years, months, days, hours, minutes, seconds };
}

export function formatCountdown(countdown: CountdownTime): string {
  const parts = [];
  
  if (countdown.years > 0) parts.push(`${countdown.years} year${countdown.years > 1 ? 's' : ''}`);
  if (countdown.months > 0) parts.push(`${countdown.months} month${countdown.months > 1 ? 's' : ''}`);
  if (countdown.days > 0) parts.push(`${countdown.days} day${countdown.days > 1 ? 's' : ''}`);
  if (countdown.hours > 0) parts.push(`${countdown.hours} hour${countdown.hours > 1 ? 's' : ''}`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''}`);
  if (countdown.seconds > 0) parts.push(`${countdown.seconds} second${countdown.seconds > 1 ? 's' : ''}`);

  return parts.join(', ') || '0 seconds';
}
