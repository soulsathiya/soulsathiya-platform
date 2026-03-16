/**
 * RotatingTagline
 * ──────────────────────────────────────────────────────────────
 * Cycles through a list of taglines with a smooth fade + upward
 * slide transition. Pauses on hover. No external dependencies —
 * uses React state/refs and inline CSS transitions only.
 *
 * Props
 *   taglines  : string[]   – lines to rotate (default: HERO_TAGLINES)
 *   interval  : number     – ms between switches (default: 3000)
 *   duration  : number     – ms for fade animation (default: 600)
 *   className : string     – optional wrapper class
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Default taglines ──────────────────────────────────────────
const HERO_TAGLINES = [
  'Find your soulmate',
  'Build a marriage based on deep compatibility',
  'Where meaningful relationships begin',
  'A journey towards lifelong partnership',
];

// ── Component ─────────────────────────────────────────────────
const RotatingTagline = ({
  taglines  = HERO_TAGLINES,
  interval  = 3000,
  duration  = 600,
  className = '',
}) => {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused,  setPaused]  = useState(false);

  // Keep refs so interval callback always reads fresh values
  const pausedRef   = useRef(paused);
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── Transition to next tagline ─────────────────────────────
  const advance = useCallback(() => {
    if (pausedRef.current) return;

    // 1. Fade out + slide up
    setVisible(false);

    // 2. After animation completes: swap text and fade back in
    timeoutRef.current = setTimeout(() => {
      setIndex(prev => (prev + 1) % taglines.length);
      setVisible(true);
    }, duration);
  }, [duration, taglines.length]);

  // ── Start / restart interval ───────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(advance, interval);
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [advance, interval]);

  // ── Pause / resume on hover ────────────────────────────────
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  // ── Inline transition styles ───────────────────────────────
  const transitionStyle = {
    transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(-10px)',
    willChange: 'opacity, transform',
  };

  return (
    /*
     * Fixed-height wrapper prevents layout shift when the text length
     * changes between taglines. Adjust min-height if you change font size.
     */
    <div
      className={`overflow-hidden ${className}`}
      style={{ minHeight: '2.4em' }}          /* enough for one line at 1.5 line-height */
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <span
        className="block text-xl sm:text-2xl font-heading font-semibold text-primary/90 leading-snug"
        style={transitionStyle}
      >
        {taglines[index]}
      </span>
    </div>
  );
};

export default RotatingTagline;
