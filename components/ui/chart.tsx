"use client";

import { useId } from "react";

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

export default function LineChart({
  labels,
  series,
  height = 220,
  formatValue = (v) => `£${v.toLocaleString()}`,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const gradientId = useId();
  const pad = { top: 14, right: 12, bottom: 26, left: 44 };
  const width = 600;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const all = series.flatMap((s) => s.values);
  const max = Math.max(...all, 1) * 1.15;
  const min = 0;

  const x = (i: number) =>
    pad.left + (i / Math.max(labels.length - 1, 1)) * innerW;
  const y = (v: number) =>
    pad.top + innerH - ((v - min) / (max - min || 1)) * innerH;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => min + (max * i) / gridLines);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={series.map((s) => s.name).join(" vs ")}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6E5B" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1B6E5B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#E3E6EC"
              strokeWidth="1"
            />
            <text
              x={pad.left - 8}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-ink-faint"
              fontSize="10"
            >
              {formatValue(Math.round(t))}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const linePoints = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          if (series.indexOf(s) === 0) {
            const area = `${pad.left},${y(0)} ${linePoints} ${x(s.values.length - 1)},${y(0)}`;
            return (
              <g key={s.name}>
                <polygon points={area} fill={`url(#${gradientId})`} />
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          }
          return (
            <polyline
              key={s.name}
              points={linePoints}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeDasharray="5 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {labels.map((label, i) => (
          <text
            key={label}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            className="fill-ink-faint"
            fontSize="10"
          >
            {label}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
