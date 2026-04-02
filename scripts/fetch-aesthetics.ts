/**
 * Build-time script to fetch all aesthetics from CARI Institute API,
 * then enrich each with high-res images and descriptions from Are.na.
 *
 * Run with: npx tsx scripts/fetch-aesthetics.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://cari.institute/api/aesthetics';
const TOTAL_PAGES = 5;
const ARENA_DELAY_MS = 100;

interface CARIAesthetic {
  name: string;
  urlSlug: string;
  startYear: string;
  endYear: string;
  decadeYear: string;
  displayImageUrl: string;
}

interface CARIResponse {
  content: Record<string, CARIAesthetic[]>[];
  page: { number: number; totalPages: number; totalElements: number };
}

interface AestheticImage {
  url: string;
  title: string;
}

interface EnrichedAesthetic {
  name: string;
  urlSlug: string;
  startYear: string;
  endYear: string;
  decadeYear: string;
  displayImageUrl: string;
  description: string;
  images: AestheticImage[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAllAesthetics(): Promise<CARIAesthetic[]> {
  const all: CARIAesthetic[] = [];

  for (let page = 0; page < TOTAL_PAGES; page++) {
    console.log(`Fetching CARI page ${page + 1}/${TOTAL_PAGES}...`);
    const res = await fetch(`${API_BASE}?page=${page}`);
    if (!res.ok) throw new Error(`Failed to fetch page ${page}: ${res.status}`);

    const data: CARIResponse = await res.json();
    for (const group of data.content) {
      for (const items of Object.values(group)) {
        for (const item of items) {
          all.push({
            name: item.name,
            urlSlug: item.urlSlug,
            startYear: item.startYear,
            endYear: item.endYear,
            decadeYear: item.decadeYear,
            displayImageUrl: item.displayImageUrl,
          });
        }
      }
    }
  }

  // Deduplicate by urlSlug
  const seen = new Set<string>();
  const unique = all.filter((a) => {
    if (seen.has(a.urlSlug)) return false;
    seen.add(a.urlSlug);
    return true;
  });

  unique.sort((a, b) => a.name.localeCompare(b.name));
  return unique;
}

/** Scrape the CARI aesthetic page to find the Are.na channel slug */
async function getArenaSlug(urlSlug: string): Promise<string | null> {
  try {
    const res = await fetch(`https://cari.institute/aesthetics/${urlSlug}`);
    if (!res.ok) return null;
    const html = await res.text();
    // HTML contains escaped slashes: https:\/\/api.are.na\/v2\/channels\/slug
    const match = html.match(/const\s+mediaSourceUrl\s*=\s*"https:[^"]*\\?\/channels\\?\/([^"?]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Fetch Are.na channel data for high-res images and description */
async function fetchArenaChannel(slug: string): Promise<{ description: string; images: AestheticImage[] } | null> {
  try {
    const res = await fetch(`https://api.are.na/v2/channels/${slug}?per=6`);
    if (!res.ok) return null;
    const data = await res.json();

    const description: string = data.metadata?.description
      ? String(data.metadata.description).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      : '';

    const images: AestheticImage[] = [];
    if (Array.isArray(data.contents)) {
      for (const item of data.contents) {
        const displayUrl = item?.image?.display?.url;
        if (displayUrl) {
          images.push({ url: displayUrl, title: item.title ?? '' });
        }
      }
    }
    return { description, images };
  } catch {
    return null;
  }
}

async function enrichAesthetics(aesthetics: CARIAesthetic[]): Promise<EnrichedAesthetic[]> {
  const enriched: EnrichedAesthetic[] = [];
  let arenaSuccessCount = 0;

  for (let i = 0; i < aesthetics.length; i++) {
    const a = aesthetics[i];
    console.log(`[${i + 1}/${aesthetics.length}] Enriching "${a.name}"...`);

    const arenaSlug = await getArenaSlug(a.urlSlug);
    await sleep(ARENA_DELAY_MS);

    let description = '';
    let images: AestheticImage[] = [];

    if (arenaSlug) {
      const channel = await fetchArenaChannel(arenaSlug);
      await sleep(ARENA_DELAY_MS);

      if (channel) {
        description = channel.description;
        images = channel.images;
        arenaSuccessCount++;
      }
    }

    enriched.push({
      name: a.name,
      urlSlug: a.urlSlug,
      startYear: a.startYear,
      endYear: a.endYear,
      decadeYear: a.decadeYear,
      // Use first Are.na display image if available, otherwise keep CARI thumbnail
      displayImageUrl: images.length > 0 ? images[0].url : a.displayImageUrl,
      description,
      images,
    });
  }

  console.log(`Are.na enrichment: ${arenaSuccessCount}/${aesthetics.length} succeeded`);
  return enriched;
}

async function main() {
  const aesthetics = await fetchAllAesthetics();
  console.log(`Fetched ${aesthetics.length} unique aesthetics from CARI`);

  const enriched = await enrichAesthetics(aesthetics);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir = join(__dirname, '..', 'src', 'data');
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'aesthetics.json');
  writeFileSync(outPath, JSON.stringify(enriched, null, 2));
  console.log(`Written ${enriched.length} aesthetics to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to fetch aesthetics:', err);
  process.exit(1);
});
