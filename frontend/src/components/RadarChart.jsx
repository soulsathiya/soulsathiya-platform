import React from 'react';

/**
 * RadarChart — premium SVG compatibility radar.
 * Pure SVG, zero dependencies.
 *
 * Props:
 *   dimensions : [{ label: string, value: number 0–100 }]
 *   size       : number  — rendered pixel size (default 300). The SVG
 *                          viewBox adds automatic padding so labels never clip.
 *   className  : string
 */
const RadarChart = ({
  dimensions = [],
  size = 300,
  className = '',
}) => {
  const defaultDimensions = [
    { label: 'Emotional Alignment', value: 88 },
    { label: 'Life Goals',          value: 92 },
    { label: 'Communication',       value: 75 },
    { label: 'Conflict Resolution', value: 68 },
    { label: 'Family Values',       value: 85 },
    { label: 'Intimacy',            value: 79 },
  ];

  const data = dimensions.length >= 3 ? dimensions : defaultDimensions;
  const n    = data.length;

  // ── Geometry ─────────────────────────────────────────────────
  // Inner chart lives in a `size × size` square, but the SVG viewBox
  // adds PAD on each side so labels (which extend beyond the chart
  // radius) are never clipped.
  const PAD       = 58;
  const VB        = size + PAD * 2;   // viewBox dimension
  const cx        = VB / 2;
  const cy        = VB / 2;
  const radius    = (size / 2) * 0.72;
  const levels    = 4;
  const angleStep = 360 / n;

  const toRad  = deg => (deg - 90) * (Math.PI / 180);
  const pt     = (angleDeg, dist) => ({
    x: cx + dist * Math.cos(toRad(angleDeg)),
    y: cy + dist * Math.sin(toRad(angleDeg)),
  });

  // ── Grid rings ───────────────────────────────────────────────
  const gridRings = Array.from({ length: levels }, (_, i) => {
    const r = (radius * (i + 1)) / levels;
    return Array.from({ length: n }, (__, j) => {
      const p = pt(j * angleStep, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  // ── Axis lines ───────────────────────────────────────────────
  const axes = Array.from({ length: n }, (_, i) => {
    const outer = pt(i * angleStep, radius);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // ── Data polygon ─────────────────────────────────────────────
  const dataPoints   = data.map((d, i) => pt(i * angleStep, (d.value / 100) * radius));
  const dataPolygon  = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // ── Labels (pushed further out for breathing room) ───────────
  const labelRadius = radius * 1.38;
  const labels = data.map((d, i) => {
    const p     = pt(i * angleStep, labelRadius);
    const angle = i * angleStep;
    // Text-anchor: left side → end, right side → start, top/bottom → middle
    let textAnchor = 'middle';
    if (angle > 20  && angle < 160) textAnchor = 'middle';
    if (angle > 200 && angle < 340) textAnchor = 'middle';
    return { ...p, label: d.label, value: d.value, textAnchor };
  });

  // ── Unique gradient IDs ───────────────────────────────────────
  const gradId   = `rcFill_${size}`;
  const glowId   = `rcGlow_${size}`;
  const centerGr = `rcCenter_${size}`;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      style={{ maxWidth: size, display: 'block' }}
      className={className}
      aria-label="Compatibility radar chart"
    >
      <defs>
        {/* Data-polygon fill gradient */}
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,165,32,0.35)" />
          <stop offset="100%" stopColor="rgba(212,165,32,0.08)" />
        </radialGradient>

        {/* Dot outer-glow filter */}
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle radial background for the chart area */}
        <radialGradient id={centerGr} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,165,32,0.06)" />
          <stop offset="100%" stopColor="rgba(212,165,32,0)" />
        </radialGradient>
      </defs>

      {/* Chart-area background glow */}
      <circle
        cx={cx} cy={cy}
        r={radius + 8}
        fill={`url(#${centerGr})`}
      />

      {/* ── Grid rings ──────────────────────────────────────── */}
      {gridRings.map((pts, i) => (
        <polygon
          key={`ring-${i}`}
          points={pts}
          fill="none"
          stroke={i === levels - 1
            ? 'rgba(212,165,32,0.35)'   /* outermost ring slightly brighter */
            : 'rgba(212,165,32,0.18)'}
          strokeWidth={i === levels - 1 ? 1.2 : 0.8}
        />
      ))}

      {/* ── Axis spokes ─────────────────────────────────────── */}
      {axes.map((ax, i) => (
        <line
          key={`ax-${i}`}
          x1={ax.x1} y1={ax.y1}
          x2={ax.x2} y2={ax.y2}
          stroke="rgba(212,165,32,0.22)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}

      {/* ── Data fill polygon ────────────────────────────────── */}
      <polygon
        points={dataPolygon}
        fill={`url(#${gradId})`}
        stroke="rgba(212,165,32,0.90)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── Data dots + outer glow rings ────────────────────── */}
      {dataPoints.map((p, i) => (
        <g key={`dot-${i}`}>
          {/* Soft outer halo */}
          <circle
            cx={p.x} cy={p.y}
            r={9}
            fill="rgba(212,165,32,0.18)"
          />
          {/* Mid ring */}
          <circle
            cx={p.x} cy={p.y}
            r={5.5}
            fill="rgba(212,165,32,0.35)"
          />
          {/* Bright core */}
          <circle
            cx={p.x} cy={p.y}
            r={3.5}
            fill="hsl(43,90%,58%)"
            stroke="rgba(255,230,120,0.8)"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* ── Labels: name + score ─────────────────────────────── */}
      {labels.map((l, i) => {
        const words = l.label.split(' ');
        // Split into max 2 lines
        const mid   = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');

        return (
          <g key={`lbl-${i}`}>
            {/* Dimension name — one or two lines */}
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="Manrope, sans-serif"
              fontWeight="500"
              fill="rgba(245,237,216,0.82)"
            >
              <tspan x={l.x} dy={line2 ? '-7' : '0'}>{line1}</tspan>
              {line2 && <tspan x={l.x} dy="13">{line2}</tspan>}
            </text>

            {/* Score badge below the label */}
            <text
              x={l.x}
              y={l.y + (line2 ? 20 : 13)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="Manrope, sans-serif"
              fontWeight="700"
              fill="hsl(43,82%,62%)"
            >
              {l.value}%
            </text>
          </g>
        );
      })}

      {/* ── Centre dot ───────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={3} fill="rgba(212,165,32,0.6)" />
    </svg>
  );
};

export default RadarChart;
