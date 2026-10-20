/**
 * Smart countdown formatter for time capsules
 * Returns formatted time string based on time remaining
 */

interface TimeUnits {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateTimeRemaining(unlockDate: string): TimeUnits {
  const now = new Date();
  const unlock = new Date(unlockDate);
  let diff = unlock.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  diff -= seconds * 1000;

  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  diff -= minutes * 1000 * 60;

  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  diff -= hours * 1000 * 60 * 60;

  const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 7);
  diff -= days * 1000 * 60 * 60 * 24;

  const weeks = Math.floor((diff / (1000 * 60 * 60 * 24 * 7)) % 4.33);
  diff -= weeks * 1000 * 60 * 60 * 24 * 7;

  const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30.44)) % 12);
  diff -= months * 1000 * 60 * 60 * 24 * 30.44;

  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));

  return { years, months, weeks, days, hours, minutes, seconds };
}

export function formatCountdown(unlockDate: string): string {
  try {
    const time = calculateTimeRemaining(unlockDate);

    // >= 1 year: show years
    if (time.years >= 1) {
      return `${time.years} year${time.years > 1 ? "s" : ""}`;
    }

    // < 1 year, >= 1 month: show months
    if (time.months >= 1) {
      return `${time.months} month${time.months > 1 ? "s" : ""}`;
    }

    // < 1 month, >= 1 week: show weeks
    if (time.weeks >= 1) {
      return `${time.weeks} week${time.weeks > 1 ? "s" : ""}`;
    }

    // < 1 week, >= 1 day: show days
    if (time.days >= 1) {
      return `${time.days} day${time.days > 1 ? "s" : ""}`;
    }

    // < 1 day, >= 6 hours: show hours only
    if (time.hours >= 6) {
      return `${time.hours} hour${time.hours > 1 ? "s" : ""}`;
    }

    // < 6 hours, >= 1 hour: show hours and minutes
    if (time.hours >= 1) {
      return `${time.hours}h ${time.minutes}m`;
    }

    // < 1 hour, >= 10 minutes: show minutes and seconds
    if (time.minutes >= 10) {
      return `${time.minutes}m ${time.seconds}s`;
    }

    // < 10 minutes: show minutes and seconds
    return `${time.minutes}m ${time.seconds}s`;
  } catch (error) {
    console.error("Error formatting countdown:", error);
    return "Loading...";
  }
}
