/**
 * SYMETRY ROULETTE — Configuration des mises
 * ============================================
 * Fichier administrable.
 *
 * Les montants de base sont définis en EUR.
 * Le système convertit automatiquement vers la devise
 * sélectionnée par le joueur à l'aide des taux ci-dessous.
 *
 * Pour modifier les mises disponibles :
 *   → Éditez le tableau `BASE_CHIPS_EUR`
 *
 * Pour mettre à jour les taux de change :
 *   → Éditez le tableau `EXCHANGE_RATES`
 *   → Indiquez la date de mise à jour dans `ratesUpdatedAt`
 */

window.RouletteBets = {

  // ─── DATE DE MISE À JOUR DES TAUX ─────────────────────
  ratesUpdatedAt: '2025-05-19',

  // ─── MISES DE BASE EN EUR ─────────────────────────────
  // Modifiez ces valeurs pour changer les jetons proposés.
  BASE_CHIPS_EUR: [5, 10, 25, 50, 100],

  // ─── TAUX DE CHANGE (1 EUR = X devise) ────────────────
  // Source : taux indicatifs du marché — à mettre à jour régulièrement.
  EXCHANGE_RATES: {
    EUR: 1,
    USD: 1.08,       // 1 EUR = 1.08 USD
    CHF: 0.96,       // 1 EUR = 0.96 CHF
    NGN: 1768.00,    // 1 EUR = 1 768 NGN  (Naira nigérian)
    AOA: 979.00,     // 1 EUR = 979 AOA    (Kwanza angolais)
    MZN: 69.20,      // 1 EUR = 69.20 MZN  (Metical mozambicain)
  },

  // ─── ARRONDI PAR DEVISE ───────────────────────────────
  // Décimales affichées et unité d'arrondi pour chaque devise.
  ROUNDING: {
    EUR: { decimals: 2, step: 0.05 },
    USD: { decimals: 2, step: 0.05 },
    CHF: { decimals: 2, step: 0.05 },
    NGN: { decimals: 0, step: 50   },   // arrondi à 50 NGN
    AOA: { decimals: 0, step: 5    },   // arrondi à 5 AOA
    MZN: { decimals: 0, step: 1    },   // arrondi à 1 MZN
  },

  // ─── MÉTHODES ─────────────────────────────────────────

  /**
   * Convertit un montant EUR vers la devise cible.
   * @param {number} amountEUR
   * @param {string} targetCurrency  ex: 'NGN'
   * @returns {number} montant arrondi dans la devise cible
   */
  convert(amountEUR, targetCurrency) {
    const rate    = this.EXCHANGE_RATES[targetCurrency] ?? 1;
    const raw     = amountEUR * rate;
    const rounding = this.ROUNDING[targetCurrency] ?? { step: 1 };
    // Arrondi à l'unité définie par step
    return Math.round(raw / rounding.step) * rounding.step;
  },

  /**
   * Retourne les valeurs de jetons converties dans la devise cible.
   * @param {string} targetCurrency
   * @returns {number[]}
   */
  chipsFor(targetCurrency) {
    return this.BASE_CHIPS_EUR.map(eur => this.convert(eur, targetCurrency));
  },

  /**
   * Retourne un tableau d'objets { eur, converted, label } pour affichage.
   * @param {string} targetCurrency
   * @param {string} symbol          ex: '₦'
   * @returns {{ eur: number, converted: number, label: string }[]}
   */
  chipsWithLabel(targetCurrency, symbol) {
    return this.BASE_CHIPS_EUR.map(eur => {
      const converted = this.convert(eur, targetCurrency);
      const rounding  = this.ROUNDING[targetCurrency] ?? { decimals: 2 };
      const label     = converted.toLocaleString('fr-FR', {
        minimumFractionDigits: rounding.decimals,
        maximumFractionDigits: rounding.decimals,
      }) + '\u00a0' + symbol;
      return { eur, converted, label };
    });
  },
};
