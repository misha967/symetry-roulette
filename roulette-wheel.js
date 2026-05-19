/**
 * SYMETRY ROULETTE — Wheel Engine
 * Handles canvas rendering and spin animation.
 *
 * Depends on: roulette-math.js (window.RouletteMath)
 * Exposes:    window.RouletteWheel = { init, spin }
 *
 * Coordinate system:
 *   - Wheel slices drawn clockwise from angle - π/2 (top)
 *   - Indicator fixed at 12 o'clock (top = -π/2)
 *   - Slot i centre on the wheel: wheelAngle - π/2 + (i + 0.5) * slice
 *   - Ball orbits counter-clockwise (positive angles grow CCW)
 */

(function () {
  'use strict';

  const RM = window.RouletteMath;

  // ─── STATE ────────────────────────────────────────────
  let canvas, ctx;
  let wheelAngle = 0;   // current wheel rotation (radians)
  let wheelR     = 0;   // outer pocket radius
  let dpr        = 1;

  // ─── INIT ─────────────────────────────────────────────
  function init(canvasEl, sectionEl) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    dpr    = window.devicePixelRatio || 1;

    const size = Math.min(sectionEl.offsetWidth, 200);
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    wheelR = size / 2 - 4;
    drawWheel(0, null);
  }

  // ─── COLORS ───────────────────────────────────────────
  const COLORS = { green: '#1a6b3a', red: '#8b1a1a', black: '#1a1a1a' };

  function numberColor(n) {
    if (n === 0) return COLORS.green;
    return RM.isRed(n) ? COLORS.red : COLORS.black;
  }

  // ─── DRAW WHEEL ───────────────────────────────────────
  function drawWheel(angle, winNumber) {
    const size  = canvas.offsetWidth;
    const cx    = size / 2;
    const cy    = size / 2;
    const r     = wheelR;
    const slice = (Math.PI * 2) / 37;

    ctx.clearRect(0, 0, size, size);

    // Wood outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    const woodGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r + 8);
    woodGrad.addColorStop(0, '#3a1f08');
    woodGrad.addColorStop(1, '#1a0800');
    ctx.fillStyle = woodGrad;
    ctx.fill();

    // Metal ring border
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Slices — clockwise
    RM.WHEEL_ORDER.forEach((num, i) => {
      const startA = angle - Math.PI / 2 + i * slice;
      const endA   = startA + slice;
      const isWin  = num === winNumber;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startA, endA);
      ctx.closePath();
      ctx.fillStyle = isWin ? '#f0f0f0' : numberColor(num);
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Number label at 83% radius
      const midA = startA + slice / 2;
      const tx = cx + r * 0.83 * Math.cos(midA);
      const ty = cy + r * 0.83 * Math.sin(midA);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midA + Math.PI / 2);
      ctx.font = `bold ${Math.max(6, r * 0.082)}px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isWin ? '#000' : '#fff';
      ctx.fillText(String(num), 0, 0);
      ctx.restore();
    });

    // Inner bowl
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.54, 0, Math.PI * 2);
    const bowlGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.54);
    bowlGrad.addColorStop(0, '#3a2010');
    bowlGrad.addColorStop(1, '#1a0800');
    ctx.fillStyle = bowlGrad;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Spokes
    for (let s = 0; s < 8; s++) {
      const sa = angle + s * (Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.55 * Math.cos(sa), cy + r * 0.55 * Math.sin(sa));
      ctx.lineTo(cx + r * 0.22 * Math.cos(sa), cy + r * 0.22 * Math.sin(sa));
      ctx.strokeStyle = '#4a2a10';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Center hub
    const hubGrad = ctx.createRadialGradient(cx - r * 0.03, cy - r * 0.03, 0, cx, cy, r * 0.18);
    hubGrad.addColorStop(0, '#aaa');
    hubGrad.addColorStop(0.5, '#555');
    hubGrad.addColorStop(1, '#222');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gold center button
    const goldGrad = ctx.createRadialGradient(cx - r * 0.02, cy - r * 0.03, 0, cx, cy, r * 0.07);
    goldGrad.addColorStop(0, '#ffe066');
    goldGrad.addColorStop(1, '#b8860b');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Fixed indicator triangle at 12 o'clock — never rotates
    ctx.save();
    ctx.translate(cx, cy - r + 2);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  // ─── DRAW BALL ────────────────────────────────────────
  function drawBall(bAngle, bRadius) {
    const size = canvas.offsetWidth;
    const cx   = size / 2;
    const cy   = size / 2;
    const bx   = cx + bRadius * Math.cos(bAngle);
    const by   = cy + bRadius * Math.sin(bAngle);
    const br   = Math.max(4, wheelR * 0.065);

    const grad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 0, bx, by, br);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#c8c8c8');
    grad.addColorStop(1, '#555');
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(bx - br * 0.28, by - br * 0.3, br * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }

  // ─── SPIN ANIMATION ───────────────────────────────────
  /**
   * Wheel: constant angular velocity (linear), always 8 turns at 1 turn/s.
   * Ball: easeOutQuad — fast start, smooth deceleration. No snap, no teleport.
   */
  function spinWheel(winNumber, onDone, playSoundFn) {
    const slice  = (Math.PI * 2) / 37;
    const winIdx = RM.WHEEL_ORDER.indexOf(winNumber);

    // ── Wheel ──
    // Normalise wheelAngle to [0, 2π) so accumulated rotations don't skew duration
    wheelAngle = ((wheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    const WHEEL_TURNS = 8;                              // always exactly 8 turns
    const DURATION    = 9000;                           // ms — fixed, always same speed
    const targetBase      = -(winIdx * slice + slice / 2) - Math.PI / 2;
    // Bring targetBase into same range then subtract full turns for CW motion
    const finalWheelAngle = targetBase - Math.PI * 2 * WHEEL_TURNS;
    // totalWheelAngle = fixed distance, independent of previous wheelAngle
    const totalWheelAngle = -(Math.PI * 2 * WHEEL_TURNS + ((wheelAngle - targetBase) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));

    const start           = performance.now();
    const startWheelAngle = wheelAngle;

    // ── Ball ──
    const finalBallA = finalWheelAngle - Math.PI / 2 + (winIdx + 0.5) * slice;

    const ballStartA      = Math.random() * Math.PI * 2;
    const ballStartR      = wheelR * 0.93;
    const ballEndR        = wheelR * 0.68;
    const BALL_DURATION   = DURATION * 0.76;

    // CCW travel that arrives exactly at finalBallA
    const MIN_BALL_TURNS  = 6;
    const rawDelta        = ((finalBallA - ballStartA) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const ballTotalTravel = rawDelta + Math.PI * 2 * (MIN_BALL_TURNS + Math.floor(Math.random() * 3));

    // ── Animation loop ──
    function frame(now) {
      const elapsed = now - start;
      const t       = Math.min(elapsed / DURATION, 1);
      const tBall   = Math.min(elapsed / BALL_DURATION, 1);

      // Wheel: perfectly linear
      const curWheelA = startWheelAngle + totalWheelAngle * t;

      let curBallA, curBallR;

      if (tBall < 1) {
        // Ball still spinning — easeOutQuad
        const tBallE = 1 - (1 - tBall) * (1 - tBall);
        curBallA = ballStartA + ballTotalTravel * tBallE;
        curBallR = ballStartR - (ballStartR - ballEndR) * tBallE;
      } else {
        // Ball has landed — lock it into the winning slot and rotate with the wheel
        const wheelDelta = curWheelA - finalWheelAngle;
        curBallA = finalBallA + wheelDelta;
        curBallR = ballEndR;
      }

      drawWheel(curWheelA, null);
      drawBall(curBallA, curBallR);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        wheelAngle = finalWheelAngle;
        drawWheel(finalWheelAngle, winNumber);
        drawBall(finalBallA, ballEndR);
        if (typeof playSoundFn === 'function') playSoundFn();
        setTimeout(onDone, 700);
      }
    }

    requestAnimationFrame(frame);
  }

  // ─── PUBLIC API ───────────────────────────────────────
  window.RouletteWheel = { init, spin: spinWheel };
})();
