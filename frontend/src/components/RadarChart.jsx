import React from 'react';

/**
 * RadarChart — premium SVG compatibility radar.
 * Pure SVG, zero dependencies.
 *
 * Props:
 *   dimensions  : [{ label: string, value: number 0–100 }]
 *   size        : number  — rendered max-width in px (default 400)
 *   showLabels  : bool    — render dimension labels inside the SVG (default true)
 *   className   : string
 */
const RadarChart = ({
  dimensions  = [],
  size        = 400,
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
  const PAD       = showLabels ? 64 : 24;
  const VB        = size + PAD * 2;
  const cx        = VB / 2;
  const cy        = VB / 2;
  const radius    = (size / 2) * 0.72;
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

  // ── Data polygon (outline only — no fill) ────────────────────
  const dataPoints  = data.map((d, i) => pt(i * angleStep, (d.value / 100) * radius));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // ── Labels ───────────────────────────────────────────────────
  const labelRadius = radius * 1.40;
  const labels = data.map((d, i) => ({
    ...pt(i * angleStep, labelRadius),
    label: d.label,
    value: d.value,
  }));

  const uid = `rc_${size}_${n}`;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      style={{ maxWidth: size, display: 'block' }}
      className={className}
      aria-label="Compatibility radar chart"
    >
      <defs>
        {/* Dot glow filter */}
        <filter id={`${uid}_glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Grid rings ────────────────────────────────────────── */}
      {gridRings.map((pts, i) => (
        <polygon
          key={`ring-${i}`}
          points={pts}
          fill="none"
          stroke={i === levels - 1
            ? 'rgba(212,175,55,0.30)'
            : 'rgba(212,175,55,0.10)'}
          strokeWidth={i === levels - 1 ? 1 : 0.6}
        />
      ))}

      {/* ── Axis spokes ───────────────────────────────────────── */}
      {axes.map((ax, i) => (
        <line
          key={`ax-${i}`}
          x1={ax.x1} y1={ax.y1}
          x2={ax.x2} y2={ax.y2}
          stroke="rgba(212,175,55,0.15)"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        />
      ))}

      {/* ── Data polygon — outline only, no fill ──────────────── */}
      <polygon
        points={dataPolygon}
        fill="none"
        stroke="#D4AF37"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* ── Vertex markers ────────────────────────────────────── */}
      {dataPoints.map((p, i) => (
        <g key={`dot-${i}`} filter={`url(#${uid}_glow)`}>
          {/* Outer halo ring */}
          <circle cx={p.x} cy={p.y} r={7} fill="rgba(212,175,55,0.12)" />
          {/* Solid core dot */}
          <circle
            cx={p.x} cy={p.y} r={4}
            fill="#D4AF37"
            stroke="rgba(255,235,130,0.8)"
            strokeWidth="1.5"
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
              fontSize="12"
              fontFamily="Manrope, sans-serif"
              fontWeight="600"
              fill="rgba(245,237,216,0.88)"
            >
              <tspan x={l.x} dy={line2 ? '-8' : '0'}>{line1}</tspan>
              {line2 && <tspan x={l.x} dy="15">{line2}</tspan>}
            </text>
            <text
              x={l.x}
              y={l.y + (line2 ? 24 : 16)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontFamily="Manrope, sans-serif"
              fontWeight="700"
              fill="#D4AF37"
            >
              {l.value}%
            </text>
          </g>
        );
      })}

      {/* ── Centre dot ────────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={3} fill="rgba(212,175,55,0.6)" />
    </svg>
  );
};

export default RadarChart;
