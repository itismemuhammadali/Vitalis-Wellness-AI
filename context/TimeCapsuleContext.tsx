import React, { createContext, useContext, useMemo, useState } from 'react';

export type UnlockTime = '6months' | '1year' | '3years' | '5years' | 'custom' | null;

interface TimeCapsuleContextType {
  unlockTime: UnlockTime;
  setUnlockTime: (time: UnlockTime) => void;
  customDate: Date | null;
  setCustomDate: (date: Date | null) => void;
  getUnlockDate: (time: UnlockTime, customDate?: Date | null) => string;
  calculateCountdown: (time: UnlockTime, customDate?: Date | null) => string;
}

const TimeCapsuleContext = createContext<TimeCapsuleContextType | undefined>(undefined);

export function TimeCapsuleProvider({ children }: { children: React.ReactNode }) {
  const [unlockTime, setUnlockTime] = useState<UnlockTime>(null);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const getUnlockDate = (time: UnlockTime, customDateParam?: Date | null) => {
    if (!time) return '';
    const today = new Date();
    const unlockDate = new Date(today);

    switch (time) {
      case '6months':
        unlockDate.setMonth(unlockDate.getMonth() + 6);
        break;
      case '1year':
        unlockDate.setFullYear(unlockDate.getFullYear() + 1);
        break;
      case '3years':
        unlockDate.setFullYear(unlockDate.getFullYear() + 3);
        break;
      case '5years':
        unlockDate.setFullYear(unlockDate.getFullYear() + 5);
        break;
      case 'custom':
        const dateToUse = customDateParam || customDate;
        if (dateToUse) {
          return dateToUse.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return 'Custom date';
    }

    return unlockDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateCountdown = (time: UnlockTime, customDateParam?: Date | null) => {
    if (!time) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let unlockDate = new Date(today);

    if (time === 'custom') {
      const dateToUse = customDateParam || customDate;
      if (!dateToUse) return 'Custom countdown';
      unlockDate = new Date(dateToUse);
      unlockDate.setHours(0, 0, 0, 0);
    } else {
      switch (time) {
        case '6months':
          unlockDate.setMonth(unlockDate.getMonth() + 6);
          break;
        case '1year':
          unlockDate.setFullYear(unlockDate.getFullYear() + 1);
          break;
        case '3years':
          unlockDate.setFullYear(unlockDate.getFullYear() + 3);
          break;
        case '5years':
          unlockDate.setFullYear(unlockDate.getFullYear() + 5);
          break;
      }
    }

    // Days in each month (non-leap year)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    let years = 0;
    let months = 0;
    let days = 0;

    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let currentDay = today.getDate();

    const targetYear = unlockDate.getFullYear();
    const targetMonth = unlockDate.getMonth();
    const targetDay = unlockDate.getDate();

    // Calculate years
    while (currentYear < targetYear) {
      currentYear++;
      years++;
    }

    // Calculate months
    while (currentMonth < targetMonth) {
      currentMonth++;
      months++;
    }

    // Calculate days
    let daysInCurrentMonth = daysInMonth[currentMonth];
    if (currentMonth === 1 && isLeapYear(currentYear)) {
      daysInCurrentMonth = 29;
    }

    if (currentDay <= targetDay) {
      days = targetDay - currentDay;
    } else {
      // Need to borrow from previous month
      months--;
      if (months < 0) {
        years--;
        months = 11;
      }
      
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      let daysInPrevMonth = daysInMonth[prevMonth];
      if (prevMonth === 1 && isLeapYear(currentYear)) {
        daysInPrevMonth = 29;
      }
      
      days = (daysInPrevMonth - currentDay) + targetDay;
    }

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''}`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <TimeCapsuleContext.Provider value={useMemo(() => ({ unlockTime, setUnlockTime, customDate, setCustomDate, getUnlockDate, calculateCountdown }), [unlockTime, customDate])}>
      {children}
    </TimeCapsuleContext.Provider>
  );
}

export function useTimeCapsule() {
  const context = useContext(TimeCapsuleContext);
  if (!context) {
    throw new Error('useTimeCapsule must be used within TimeCapsuleProvider');
  }
  return context;
}
