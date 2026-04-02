import type { Aesthetic } from '../types';

/**
 * Calculate display percentages for the top 3 aesthetics.
 * Since Beli uses positional ranking (not numeric scores), we derive
 * percentages from bucket tiers and position within each bucket.
 */
export function calculatePercentages(
  topThree: Aesthetic[],
  allBuckets: { like: Aesthetic[]; meh: Aesthetic[]; nope: Aesthetic[] },
): number[] {
  if (topThree.length < 3) return [];

  const bucketWeight: Record<string, number> = { like: 3, meh: 2, nope: 1 };

  function getBucketForAesthetic(aesthetic: Aesthetic): string {
    for (const [bucket, items] of Object.entries(allBuckets)) {
      if (items.some((a) => a.urlSlug === aesthetic.urlSlug)) {
        return bucket;
      }
    }
    return 'meh';
  }

  function getPositionInBucket(aesthetic: Aesthetic, bucket: string): number {
    const items = allBuckets[bucket as keyof typeof allBuckets];
    return items.findIndex((a) => a.urlSlug === aesthetic.urlSlug);
  }

  // Check if all 3 are in the same bucket
  const buckets = topThree.map(getBucketForAesthetic);
  const allSameBucket = buckets.every((b) => b === buckets[0]);

  if (allSameBucket) {
    // Position-weighted within same bucket: 50/30/20
    return [50, 30, 20];
  }

  // Cross-bucket: weight by tier + position bonus
  const rawScores = topThree.map((aesthetic, rank) => {
    const bucket = getBucketForAesthetic(aesthetic);
    const tier = bucketWeight[bucket] ?? 1;
    const pos = getPositionInBucket(aesthetic, bucket);
    // Higher tier = more weight; earlier position = slight bonus
    const posBonus = Math.max(0, 1 - pos * 0.1);
    return tier * (1 + posBonus) * (3 - rank);
  });

  const total = rawScores.reduce((sum, s) => sum + s, 0);
  if (total === 0) return [34, 33, 33];

  const percentages = rawScores.map((s) => Math.round((s / total) * 100));

  // Ensure they sum to exactly 100
  const diff = 100 - percentages.reduce((sum, p) => sum + p, 0);
  percentages[0] += diff;

  return percentages;
}

/**
 * Get images for mood board display.
 * Returns up to `count` images for an aesthetic, falling back to displayImageUrl.
 */
export function getMoodBoardImages(
  aesthetic: Aesthetic,
  count: number,
): { url: string; title: string }[] {
  const images = aesthetic.images?.length
    ? aesthetic.images
    : [{ url: aesthetic.displayImageUrl, title: aesthetic.name }];

  return images.slice(0, count);
}
