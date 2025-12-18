/**
 * Time Phase Utilities for Dashboard Mode
 *
 * Determines the current time phase for contextual UI switching:
 * - Morning (4:00 AM - 11:00 AM): Focus on intentions, planning
 * - Midday (11:00 AM - 5:00 PM): Focus on execution, check-ins
 * - Evening (5:00 PM - 4:00 AM): Focus on reflection, summary
 */

/**
 * Time phase boundaries (in 24-hour format)
 */
export const TIME_PHASES = {
  morning: { start: 4, end: 11 },   // 4:00 AM - 10:59 AM
  midday: { start: 11, end: 17 },   // 11:00 AM - 4:59 PM
  evening: { start: 17, end: 4 }    // 5:00 PM - 3:59 AM (next day)
};

/**
 * Get current time phase based on system time
 * @param {Date} [date] - Optional date to check (defaults to now)
 * @returns {'morning' | 'midday' | 'evening'}
 */
export const getTimePhase = (date = new Date()) => {
  const hour = date.getHours();

  if (hour >= TIME_PHASES.morning.start && hour < TIME_PHASES.morning.end) {
    return 'morning';
  }

  if (hour >= TIME_PHASES.midday.start && hour < TIME_PHASES.midday.end) {
    return 'midday';
  }

  // Evening: 5 PM to 4 AM (wraps around midnight)
  return 'evening';
};

/**
 * Get the primary intent based on time phase
 * @param {'morning' | 'midday' | 'evening'} timePhase
 * @returns {'plan' | 'reflect' | 'integrate'}
 */
export const getPrimaryIntent = (timePhase) => {
  switch (timePhase) {
    case 'morning':
      return 'plan';      // Focus on setting intentions
    case 'evening':
      return 'reflect';   // Focus on daily wrap-up
    case 'midday':
    default:
      return 'integrate'; // Focus on execution & check-ins
  }
};

/**
 * Get time-appropriate greeting
 * @param {string} [name] - Optional user name
 * @param {Date} [date] - Optional date (defaults to now)
 * @returns {string}
 */
export const getTimeGreeting = (name, date = new Date()) => {
  const phase = getTimePhase(date);
  const nameStr = name ? `, ${name}` : '';

  switch (phase) {
    case 'morning':
      return `Good morning${nameStr}`;
    case 'midday':
      return `Good afternoon${nameStr}`;
    case 'evening':
      const hour = date.getHours();
      if (hour >= 21 || hour < 4) {
        return `Good night${nameStr}`;
      }
      return `Good evening${nameStr}`;
    default:
      return `Hello${nameStr}`;
  }
};

/**
 * Get time until next phase change
 * @param {Date} [date] - Optional date (defaults to now)
 * @returns {{ nextPhase: string, hoursUntil: number, minutesUntil: number }}
 */
export const getTimeUntilPhaseChange = (date = new Date()) => {
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hour * 60 + minutes;

  let nextPhaseHour;
  let nextPhase;

  if (hour >= 4 && hour < 11) {
    nextPhaseHour = 11;
    nextPhase = 'midday';
  } else if (hour >= 11 && hour < 17) {
    nextPhaseHour = 17;
    nextPhase = 'evening';
  } else {
    // Evening phase - next phase is morning at 4 AM
    nextPhaseHour = hour >= 17 ? 24 + 4 : 4; // Handle wrap around midnight
    nextPhase = 'morning';
  }

  const nextPhaseMinutes = nextPhaseHour * 60;
  const minutesUntil = nextPhaseMinutes - currentMinutes;

  return {
    nextPhase,
    hoursUntil: Math.floor(minutesUntil / 60),
    minutesUntil: minutesUntil % 60
  };
};

/**
 * Check if we're in a transition period (within 30 min of phase change)
 * Useful for smoother UI transitions
 * @param {Date} [date] - Optional date (defaults to now)
 * @returns {boolean}
 */
export const isInTransitionPeriod = (date = new Date()) => {
  const { minutesUntil, hoursUntil } = getTimeUntilPhaseChange(date);
  const totalMinutes = hoursUntil * 60 + minutesUntil;
  return totalMinutes <= 30;
};

export default {
  TIME_PHASES,
  getTimePhase,
  getPrimaryIntent,
  getTimeGreeting,
  getTimeUntilPhaseChange,
  isInTransitionPeriod
};
