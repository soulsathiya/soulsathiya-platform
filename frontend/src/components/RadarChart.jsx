import React from 'react';

/**
 * RadarChart — premium SVG compatibility radar.
 * Pure SVG, zero dependencies.
 *
 * Props:
 *   dimensions  : [{ label: string, value: number 0–100 }]
 *   size        : number  — rendered max-width in px (default 320)
 *   showLabels  : bool    — render dimension labels inside the SVG (default true)
 *                          Set false when labels are displayed externally.
 *   className   : string
 */
const RadarChart = ({
  dimensions  = [],
  size        = 320,
  showLabels  = true,
  className   = '',
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
  // PAD adds breathing room for labels; when labels are hidden we
  // use a smaller pad so the polygon fills the space better.
  const PAD       = showLabels ? 56 : 24;
  const VB        = size + PAD * 2;
  const cx        = VB / 2;
  const cy        = VB / 2;
  const radius    = (size / 2) * 0.78;
  const levels    = 5;
  const angleStep = 360 / n;

  const toRad = deg => (deg - 90) * (Math.PI / 180);
  const pt    = (angleDeg, dist) => ({
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

  // ── Axes ─────────────────────────────────────────────────────
  const axes = Array.from({ length: n }, (_, i) => {
    const outer = pt(i * angleStep, radius);
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y };
  });

  // ── Data polygon ─────────────────────────────────────────────
  const dataPoints  = data.map((d, i) => pt(i * angleStep, (d.value / 100) * radius));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // ── Labels ───────────────────────────────────────────────────
  const labelRadius = radius * 1.36;
  const labels = data.map((d, i) => ({
    ...pt(i * angleStep, labelRadius),
    label: d.label,
    value: d.value,
  }));

  // Unique IDs per instance to avoid SVG defs collisions
  const uid      = `rc_${size}_${showLabels ? 1 : 0}`;
  const fillId   = `${uid}_fill`;
  const bgId     = `${uid}_bg`;
  const glowId   = `${uid}_glow`;
  const outerGlowId = `${uid}_oglow`;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      style={{ maxWidth: size, display: 'block' }}
      className={className}
      aria-label="Compatibility radar chart"
    >
      <defs>
        {/* Data-polygon gradient fill */}
        <radialGradient id={fillId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,165,32,0.55)" />
          <stop offset="70%"  stopColor="rgba(212,165,32,0.22)" />
          <stop offset="100%" stopColor="rgba(212,165,32,0.05)" />
        </radialGradient>

        {/* Chart background */}
        <radialGradient id={bgId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(212,165,32,0.08)" />
          <stop offset="100%" stopColor="rgba(212,165,32,0)" />
        </radialGradient>

        {/* Dot glow filter */}
        <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Outer polygon glow */}
        <filter id={outerGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background radial glow ─────────────────────────────── */}
      <circle cx={cx} cy={cy} r={radius + 10} fill={`url(#${bgId})`} />

      {/* ── Grid rings ────────────────────────────────────────── */}
      {gridRings.map((pts, i) => (
        <polygon
          key={`ring-${i}`}
          points={pts}
          fill="none"
          stroke={i === levels - 1
            ? 'rgba(212,165,32,0.40)'
            : 'rgba(212,165,32,0.14)'}
          strokeWidth={i === levels - 1 ? 1.5 : 0.8}
        />
      ))}

      {/* ── Axis spokes ───────────────────────────────────────── */}
      {axes.map((ax, i) => (
        <line
          key={`ax-${i}`}
          x1={ax.x1} y1={ax.y1}
          x2={ax.x2} y2={ax.y2}
          stroke="rgba(212,165,32,0.20)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* ── Data polygon — glow copy + sharp fill ─────────────── */}
      {/* Blurred glow layer behind */}
      <polygon
        points={dataPolygon}
        fill="rgba(212,165,32,0.25)"
        stroke="rgba(212,165,32,0.6)"
        strokeWidth="6"
        strokeLinejoin="round"
        filter={`url(#${outerGlowId})`}
      />
      {/* Sharp fill on top */}
      <polygon
        points={dataPolygon}
        fill={`url(#${fillId})`}
        stroke="rgba(212,165,32,1)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ── Data dots — halo + core ────────────────────────────── */}
      {dataPoints.map((p, i) => (
        <g key={`dot-${i}`}>
          {/* Outer halo */}
          <circle cx={p.x} cy={p.y} r={10} fill="rgba(212,165,32,0.15)" />
          {/* Mid ring */}
          <circle cx={p.x} cy={p.y} r={6}  fill="rgba(212,165,32,0.30)" />
          {/* Bright core */}
          <circle
            cx={p.x} cy={p.y} r={3.5}
            fill="hsl(43,95%,65%)"
            stroke="rgba(255,235,130,0.9)"
            strokeWidth="1.5"
            filter={`url(#${glowId})`}
          />
        </g>
      ))}

      {/* ── Labels (only when showLabels=true) ────────────────── */}
      {showLabels && labels.map((l, i) => {
        const words = l.label.split(' ');
        const mid   = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        return (
          <g key={`lbl-${i}`}>
            <text
              x={l.x} y={l.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="Manrope, sans-serif"
              fontWeight="600"
              fill="rgba(245,237,216,0.90)"
            >
              <tspan x={l.x} dy={line2 ? '-7' : '0'}>{line1}</tspan>
              {line2 && <tspan x={l.x} dy="14">{line2}</tspan>}
            </text>
            <text
              x={l.x}
              y={l.y + (line2 ? 22 : 14)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="Manrope, sans-serif"
              fontWeight="700"
              fill="hsl(43,90%,65%)"
            >
              {l.value}%
            </text>
          </g>
        );
      })}

      {/* ── Centre dot ────────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={3.5} fill="rgba(212,165,32,0.8)" />
      <circle cx={cx} cy={cy} r={7}   fill="rgba(212,165,32,0.15)" />
    </svg>
  );
};

export default RadarChart;
