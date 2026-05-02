export function computeAgingScore(createdAt: Date, baseQuality = 100): number {
  const hoursOld = (Date.now() - createdAt.getTime()) / 3_600_000;
  const decayRate = 0.02; // 2% per hour
  const multiplier = Math.max(0.3, 1 - hoursOld * decayRate);
  return Math.round(baseQuality * multiplier);
}

export function agingColor(score: number): string {
  if (score >= 80) return "#00d084";
  if (score >= 50) return "#fbbf24";
  return "#ff4d4d";
}

export function hoursOld(createdAt: Date): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000);
}
