/**
 * Time-awareness utility for off-hours protocol.
 *
 * During off-hours (nights/weekends), the agent lowers its auto-pause
 * threshold because no human operators are available to intervene quickly.
 */

// Module-level flag for demo toggle
let _forceOffHours = false;

export function setForceOffHours(value) {
  _forceOffHours = Boolean(value);
}

export function getForceOffHours() {
  return _forceOffHours;
}

/**
 * True if hour is between 10 PM and 6 AM.
 */
export function isNightTime(date = new Date()) {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

/**
 * True if Saturday or Sunday.
 */
export function isWeekend(date = new Date()) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * True if night OR weekend.
 */
export function isOffHours(date = new Date()) {
  if (_forceOffHours) return true;
  return isNightTime(date) || isWeekend(date);
}

/**
 * Returns structured time context for agent decisions.
 */
export function getTimeContext(date = new Date()) {
  const offHours = isOffHours(date);
  const night = isNightTime(date);
  const weekend = isWeekend(date);

  let reason = null;
  if (_forceOffHours) {
    reason = 'Off-hours simulation enabled';
  } else if (night && weekend) {
    reason = 'Weekend night — no operators available';
  } else if (weekend) {
    reason = 'Weekend — reduced operator coverage';
  } else if (night) {
    reason = 'Night shift — limited operator coverage';
  }

  return {
    isOffHours: offHours,
    isNight: night,
    isWeekend: weekend,
    reason,
    // Lower threshold during off-hours: pause at 30% instead of 50%
    pauseThresholdOverride: offHours ? 30 : 50,
    // Escalate warnings more aggressively during off-hours
    warningEscalation: offHours,
    timestamp: date.toISOString(),
  };
}

export default { getTimeContext, isOffHours, setForceOffHours, getForceOffHours };
