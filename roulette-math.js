/**
 * SYMETRY ROULETTE — Math Engine
 * European Roulette: 37 numbers (0-36), natural RTP 97.297%
 *
 * House edge = 1/37 = 2.703%
 * All bets return exactly 36/37 = 97.297% RTP
 */

// ─── WHEEL LAYOUT ────────────────────────────────────────────
// European wheel order (physical sequence)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers (European roulette standard)
const RED_NUMBERS = new Set([
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

function isRed(n)   { return n !== 0 && RED_NUMBERS.has(n); }
function isBlack(n) { return n !== 0 && !RED_NUMBERS.has(n); }
function isEven(n)  { return n !== 0 && n % 2 === 0; }
function isOdd(n)   { return n !== 0 && n % 2 !== 0; }
function isLow(n)   { return n >= 1 && n <= 18; }
function isHigh(n)  { return n >= 19 && n <= 36; }
function dozen(n)   { return n === 0 ? 0 : Math.ceil(n / 12); } // 1,2,3
function column(n)  { return n === 0 ? 0 : ((n - 1) % 3) + 1; } // 1,2,3

// ─── BET TYPES ───────────────────────────────────────────────
const BET_TYPES = {
  // Inside bets
  straight:  { payout: 35, minNumbers: 1, maxNumbers: 1,  label: 'Plein' },
  split:     { payout: 17, minNumbers: 2, maxNumbers: 2,  label: 'Cheval' },
  street:    { payout: 11, minNumbers: 3, maxNumbers: 3,  label: 'Transversale' },
  corner:    { payout: 8,  minNumbers: 4, maxNumbers: 4,  label: 'Carré' },
  sixline:   { payout: 5,  minNumbers: 6, maxNumbers: 6,  label: 'Sixain' },
  // Outside bets
  dozen:     { payout: 2,  minNumbers: 12, maxNumbers: 12, label: 'Douzaine' },
  column:    { payout: 2,  minNumbers: 12, maxNumbers: 12, label: 'Colonne' },
  red:       { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Rouge' },
  black:     { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Noir' },
  even:      { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Pair' },
  odd:       { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Impair' },
  low:       { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Manque' },
  high:      { payout: 1,  minNumbers: 18, maxNumbers: 18, label: 'Passe' },
};

// ─── BET EVALUATION ──────────────────────────────────────────
/**
 * Evaluate a single bet against the winning number.
 * @param {object} bet  - { type, numbers: [...], amount }
 * @param {number} win  - winning number 0-36
 * @returns {number}    - net result (positive = win, negative = loss)
 */
function evaluateBet(bet, win) {
  const { type, numbers, amount } = bet;
  const hits = numbers.includes(win);

  if (!hits) return -amount;

  const payout = BET_TYPES[type].payout;
  return amount * payout; // net win (original stake returned separately)
}

/**
 * Evaluate all bets for a spin.
 * Returns { totalNet, results: [{bet, net, win}] }
 */
function evaluateSpin(bets, winNumber) {
  let totalNet = 0;
  const results = bets.map(bet => {
    const net = evaluateBet(bet, winNumber);
    totalNet += net;
    return { bet, net, won: net > 0 };
  });
  // Return original stakes
  totalNet += bets.reduce((s, b) => s + b.amount, 0);
  return { totalNet, results };
}

// ─── VALID BET HELPERS ───────────────────────────────────────
// Grid layout: numbers 1-36 in 3 columns, 12 rows
// col 1: 1,4,7,10,13,16,19,22,25,28,31,34
// col 2: 2,5,8,11,14,17,20,23,26,29,32,35
// col 3: 3,6,9,12,15,18,21,24,27,30,33,36

function gridRow(n) { return Math.ceil(n / 3); }      // 1-12
function gridCol(n) { return ((n - 1) % 3) + 1; }    // 1-3

// Valid splits: horizontal (same row, adjacent col) or vertical (same col, adjacent row)
function isValidSplit(a, b) {
  if (a === 0 || b === 0) return false;
  const ra = gridRow(a), rb = gridRow(b);
  const ca = gridCol(a), cb = gridCol(b);
  return (ra === rb && Math.abs(ca - cb) === 1) ||
         (ca === cb && Math.abs(ra - rb) === 1);
}

// Valid corner: 2x2 block
function isValidCorner(nums) {
  if (nums.length !== 4 || nums.some(n => n === 0)) return false;
  const rows = [...new Set(nums.map(gridRow))].sort((a,b)=>a-b);
  const cols = [...new Set(nums.map(gridCol))].sort((a,b)=>a-b);
  return rows.length === 2 && cols.length === 2 &&
         rows[1] - rows[0] === 1 && cols[1] - cols[0] === 1;
}

// ─── SPIN GENERATION ─────────────────────────────────────────
function spin() {
  return Math.floor(Math.random() * 37); // 0-36
}

// ─── NUMBER METADATA ─────────────────────────────────────────
function numberInfo(n) {
  return {
    number: n,
    color:  n === 0 ? 'green' : isRed(n) ? 'red' : 'black',
    dozen:  dozen(n),
    column: column(n),
    even:   isEven(n),
    odd:    isOdd(n),
    low:    isLow(n),
    high:   isHigh(n),
  };
}

// ─── RTP VERIFICATION ────────────────────────────────────────
function verifyRTP(betType, numbers) {
  // P(win) = numbers.length / 37
  const pWin = numbers.length / 37;
  const payout = BET_TYPES[betType].payout;
  // RTP = P(win) * (payout + 1) [payout + stake return]
  return pWin * (payout + 1);
}

function verifyAllRTPs() {
  const results = {};
  Object.entries(BET_TYPES).forEach(([type, info]) => {
    results[type] = (verifyRTP(type, Array(info.minNumbers).fill(1)) * 100).toFixed(3) + '%';
  });
  return results;
  // All should return 97.297%
}

// ─── EXPORTS ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WHEEL_ORDER, RED_NUMBERS, BET_TYPES,
    isRed, isBlack, isEven, isOdd, isLow, isHigh, dozen, column,
    evaluateBet, evaluateSpin, spin, numberInfo,
    isValidSplit, isValidCorner, gridRow, gridCol,
    verifyRTP, verifyAllRTPs
  };
} else {
  window.RouletteMath = {
    WHEEL_ORDER, RED_NUMBERS, BET_TYPES,
    isRed, isBlack, isEven, isOdd, isLow, isHigh, dozen, column,
    evaluateBet, evaluateSpin, spin, numberInfo,
    isValidSplit, isValidCorner, gridRow, gridCol,
    verifyRTP, verifyAllRTPs
  };
}
