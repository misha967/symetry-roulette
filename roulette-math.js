// roulette-math.js — Symetry Studio
// RTP européen : 97.3% (37 cases, une seule case zéro)

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36,
  11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9,
  22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [
  1,3,5,7,9,12,14,16,18,21,23,25,27,30,32,34,36
];

function getColor(n) {
  if (n === 0) return 'green';
  return RED_NUMBERS.includes(n) ? 'red' : 'black';
}

function resolveBets(bets, result) {
  let totalWin = 0;
  const color = getColor(result);

  bets.forEach(bet => {
    const { type, numbers, amount } = bet;

    let win = 0;

    if (type === 'straight' && numbers.includes(result)) {
      win = amount * 35;
    } else if (type === 'split' && numbers.includes(result)) {
      win = amount * 17;
    } else if (type === 'street' && numbers.includes(result)) {
      win = amount * 11;
    } else if (type === 'corner' && numbers.includes(result)) {
      win = amount * 8;
    } else if (type === 'line' && numbers.includes(result)) {
      win = amount * 5;
    } else if (type === 'dozen' && numbers.includes(result)) {
      win = amount * 2;
    } else if (type === 'column' && numbers.includes(result)) {
      win = amount * 2;
    } else if (type === 'red' && color === 'red') {
      win = amount * 1;
    } else if (type === 'black' && color === 'black') {
      win = amount * 1;
    } else if (type === 'even' && result !== 0 && result % 2 === 0) {
      win = amount * 1;
    } else if (type === 'odd' && result % 2 === 1) {
      win = amount * 1;
    } else if (type === 'low' && result >= 1 && result <= 18) {
      win = amount * 1;
    } else if (type === 'high' && result >= 19 && result <= 36) {
      win = amount * 1;
    }

    if (win > 0) totalWin += win + amount; // gain + mise remboursée
  });

  return totalWin;
}

function spinResult() {
  const idx = Math.floor(Math.random() * 37);
  return ROULETTE_NUMBERS[idx];
}
