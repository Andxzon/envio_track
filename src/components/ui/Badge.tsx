// ============================================================================
// EnvioTrack — Badge de estado
// ============================================================================
'use client';

import { STATUS_CONFIG, type ShipmentStatus } from '@/lib/types';

interface BadgeProps {
  status: ShipmentStatus;
  size?: 'sm' | 'md';
  onChange?: (status: ShipmentStatus) => void;
}

export function Badge({ status, size = 'md', onChange }: BadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`status-badge relative overflow-hidden ${config.bgClass} ${config.textClass} ${sizeClasses} ${onChange ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      <span className="text-[10px]">{config.emoji}</span>
      {config.label}
      {onChange && (
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as ShipmentStatus)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>
              {val.emoji} {val.label}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}
