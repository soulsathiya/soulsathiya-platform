import React from 'react';

/**
 * Lightweight SVG radar chart for compatibility dimensions.
 * No external dependencies — pure SVG.
 *
 * Props:
 *   dimensions: [{ label: string, value: number (0-100) }]
 *   size: number (default 240)
 *   className: string
 */
const RadarChart = ({
  dimensions = [],
  size = 240,
  className = '',
}) => {
  const defaultDimensions = [
    { label: 'Emotional Alignment', value: 88 },
    { label: 'Life Goals', value: 92 },
    { label: 'Communication', value: 75 },
    { label: 'Conflict Resolution', value: 68 },
    { label: 'Family Values', value: 85 },
    { label: 'Intimacy', value: 79 },
  ];

  const data = dimensions.length >= 3 ? dimensions : defaultDimensions;
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.72;
  const levels = 4;

  // Compute polygon point at angle + distance
  const point = (angle, dist) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + dist * Math.cos(rad),
      y: cy + dist * Math.sin(rad),
    };
  };

  const angleStep = 360 / n;

  // Build grid rings
  const gridRings = Array.from({ length: levels }, (_, i) => {
    const r = (radius * (i + 1)) / levels;
    const pts = Array.from({ length: n }, (_, j) => {
      const p = point(j * angleStep, r);
      return `${p.x},${p.y}`;
    }).join(' ');
    return pts;
  });

  // Build data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * radius;
    return point(i * angleStep, r);
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const outer = point(i * angleStep, radius);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // Label positions (slightly beyond radius)
  const labelRadius = radius * 1.22;
  const labels = data.map((d, i) => {
    const p = point(i * angleStep, labelRadius);
    const angle = i * angleStep;
    let textAnchor = 'middle';
    if (angle > 10 && angle < 170) textAnchor = 'middle';
    if (angle >= 170 && angle <= 190) textAnchor = 'middle';
    // Fine-tune anchor for left vs right
    if (angle > 190 && angle < 350) textAnchor = 'middle';
    return { ...p, label: d.label, value: d.value, textAnchor };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-label="Compatibility radar chart"
    >
      {/* Grid rings */}
      {gridRings.map((pts, i) => (
        <polygon
          key={`ring-${i}`}
          points={pts}
          fill="none"
          stroke="rgba(212,165,32,0.15)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {axes.map((ax, i) => (
        <line
          key={`ax-${i}`}
          x1={ax.x1} y1={ax.y1}
          x2={ax.x2} y2={ax.y2}
          stroke="rgba(212,165,32,0.2)"
          strokeWidth="1"
        />
      ))}

      {/* Data fill */}
      <polygon
        points={dataPolygon}
        fill="rgba(212,165,32,0.18)"
        stroke="rgba(212,165,32,0.85)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x} cy={p.y}
          r={3.5}
          fill="hsl(43,82%,52%)"
          stroke="rgba(212,165,32,0.4)"
          strokeWidth="1.5"
        />
      ))}

      {/* Labels */}
      {labels.map((l, i) => {
        // Split long labels onto two lines
        const words = l.label.split(' ');
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        return (
          <text
            key={`lbl-${i}`}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontFamily="Manrope, sans-serif"
            fill="rgba(245,237,216,0.75)"
          >
            <tspan x={l.x} dy="-5">{line1}</tspan>
            {line2 && <tspan x={l.x} dy="11">{line2}</tspan>}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="rgba(212,165,32,0.5)" />
    </svg>
  );
};

export default RadarChart;
