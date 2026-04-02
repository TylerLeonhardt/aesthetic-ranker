/**
 * Build-time script to fetch all aesthetics from CARI Institute API.
 * Run with: npx tsx scripts/fetch-aesthetics.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://cari.institute/api/aesthetics';
const TOTAL_PAGES = 5;

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

async function fetchAllAesthetics(): Promise<CARIAesthetic[]> {
  const all: CARIAesthetic[] = [];

  for (let page = 0; page < TOTAL_PAGES; page++) {
    console.log(`Fetching page ${page + 1}/${TOTAL_PAGES}...`);
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

async function main() {
  const aesthetics = await fetchAllAesthetics();
  console.log(`Fetched ${aesthetics.length} unique aesthetics`);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outDir = join(__dirname, '..', 'src', 'data');
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'aesthetics.json');
  writeFileSync(outPath, JSON.stringify(aesthetics, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error('Failed to fetch aesthetics:', err);
  process.exit(1);
});
