
/**
 * Poisson probability mass function: P(X=k) = (lambda^k * e^-lambda) / k!
 */
export function poisson(lambda: number, k: number): number {
  if (k < 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Calculates match outcome probabilities based on Poisson distribution
 */
export function calculateOutcomeProbs(lambdaHome: number, lambdaAway: number) {
  const maxGoals = 10;
  let pHomeWin = 0;
  let pDraw = 0;
  let pAwayWin = 0;

  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = poisson(lambdaHome, h) * poisson(lambdaAway, a);
      if (h > a) pHomeWin += prob;
      else if (h === a) pDraw += prob;
      else pAwayWin += prob;
    }
  }

  // Normalize (should be close to 1 already)
  const total = pHomeWin + pDraw + pAwayWin;
  return {
    home: pHomeWin / total,
    draw: pDraw / total,
    away: pAwayWin / total
  };
}

/**
 * Specific probabilities for A+1 Asian markets
 */
export function calculateAsianProbs(outcomeProbs: { home: number, draw: number, away: number }) {
  const { home, draw, away } = outcomeProbs;

  return {
    // Asian 0.0 (DNB): Win prob = P(W) / (P(W) + P(L))
    homeDNB: home / (home + away),
    awayDNB: away / (home + away),
    
    // Asian +0.5: Win prob = P(W) + P(D)
    homePlus05: home + draw,
    awayPlus05: away + draw
  };
}
