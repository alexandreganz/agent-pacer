/**
 * StatusBadge - Color-coded status indicator component.
 *
 * Displays status with appropriate color and optional pulse animation for critical states.
 */

const statusConfig = {
  healthy: {
    bg: 'bg-status-healthy',
    text: 'text-white',
    label: 'HEALTHY',
    pulse: false,
  },
  warning: {
    bg: 'bg-status-warning',
    text: 'text-gray-900',
    label: 'WARNING',
    pulse: false,
  },
  critical: {
    bg: 'bg-status-critical',
    text: 'text-white',
    label: 'CRITICAL',
    pulse: true,
  },
  escalated: {
    bg: 'bg-status-escalated',
    text: 'text-white',
    label: 'ESCALATED',
    pulse: false,
  },
  paused: {
    bg: 'bg-gray-500',
    text: 'text-white',
    label: 'PAUSED',
    pulse: false,
  },
};

export function StatusBadge({ status, size = 'md', showLabel = true, className = '' }) {
  const config = statusConfig[status] || statusConfig.healthy;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${config.bg} ${config.text}
        ${sizeClasses[size]}
        ${config.pulse ? 'animate-pulse-critical' : ''}
        ${className}
      `}
    >
      <span
        className={`
          w-2 h-2 rounded-full
          ${status === 'healthy' ? 'bg-white' : ''}
          ${status === 'warning' ? 'bg-gray-900' : ''}
          ${status === 'critical' ? 'bg-white' : ''}
          ${status === 'escalated' ? 'bg-white' : ''}
          ${status === 'paused' ? 'bg-white' : ''}
        `}
      />
      {showLabel && config.label}
    </span>
  );
}

export default StatusBadge;
