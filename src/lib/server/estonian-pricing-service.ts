import "server-only";
import {
  listCases,
  listCompactAiSystems,
  listCpuCoolers,
  listCpus,
  listGpus,
  listMotherboards,
  listPowerSupplies,
  listRamKits,
  listStorageDrives,
  upsertEstonianPriceCheck,
} from "@/lib/catalog-db";

type ComponentRow = {
  category: string;
  itemId: number;
  name: string;
  basePriceEur: number;
};

type RefreshSummary = {
  checked: number;
  updated: number;
  skipped: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
};

const ASSEMBLY_MARKUP = 15;
const FETCH_TIMEOUT_MS = 9000;

function normalizeEuroString(value: string): number | null {
  const cleaned = value.replace(/\s/g, "").replace(/\u00a0/g, "");
  const withDot = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(/,/g, ".") : cleaned;
  const parsed = Number.parseFloat(withDot);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < 20 || parsed > 50000) {
    return null;
  }
  return parsed;
}

function extractEuroPrices(html: string): number[] {
  const values: number[] = [];
  const patterns = [
    /(\d{1,3}(?:[\s.]\d{3})*(?:,\d{2})?)\s?€/g,
    /€\s?(\d{1,3}(?:[\s.]\d{3})*(?:,\d{2})?)/g,
    /(\d{1,5}(?:[.,]\d{2})?)\s?EUR/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const maybe = normalizeEuroString(match[1] ?? "");
      if (maybe !== null) {
        values.push(maybe);
      }
    }
  }

  return values;
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchEstonianSourcePrice(query: string, basePrice: number): Promise<{ price: number; source: string } | null> {
  const encoded = encodeURIComponent(query);

  const sources: Array<{ name: string; url: string }> = [
    {
      name: "Hinnavaatlus",
      url: `https://www.hinnavaatlus.ee/search/?query=${encoded}`,
    },
    {
      name: "1a.ee",
      url: `https://www.1a.ee/search?query=${encoded}`,
    },
    {
      name: "Kaup24",
      url: `https://kaup24.ee/et/search?q=${encoded}`,
    },
  ];

  for (const source of sources) {
    const html = await fetchWithTimeout(source.url);
    if (!html) {
      continue;
    }

    const prices = extractEuroPrices(html)
      .filter((price) => price >= basePrice * 0.45 && price <= basePrice * 2.6)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      continue;
    }

    const sample = prices.slice(0, Math.min(6, prices.length));
    const avg = sample.reduce((sum, current) => sum + current, 0) / sample.length;
    return { price: avg, source: source.name };
  }

  return null;
}

function collectComponents(): ComponentRow[] {
  const components: ComponentRow[] = [];

  listGpus().forEach((item) => {
    components.push({ category: "gpu", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listCpus().forEach((item) => {
    components.push({ category: "cpu", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listRamKits().forEach((item) => {
    components.push({ category: "ram_kit", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listPowerSupplies().forEach((item) => {
    components.push({ category: "power_supply", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listCases().forEach((item) => {
    components.push({ category: "case", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listMotherboards().forEach((item) => {
    components.push({ category: "motherboard", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listCompactAiSystems().forEach((item) => {
    components.push({ category: "compact_ai_system", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listStorageDrives().forEach((item) => {
    components.push({ category: "storage_drive", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });
  listCpuCoolers().forEach((item) => {
    components.push({ category: "cpu_cooler", itemId: item.id, name: item.name, basePriceEur: item.price_eur });
  });

  return components;
}

async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        break;
      }
      await fn(next);
    }
  });

  await Promise.all(workers);
}

export async function refreshEstonianMarketPricing(): Promise<RefreshSummary> {
  const startedAt = new Date().toISOString();
  const components = collectComponents();

  const limitRaw = Number.parseInt(process.env.ESTONIAN_PRICE_MAX_ITEMS ?? "120", 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, limitRaw) : 120;
  const concurrencyRaw = Number.parseInt(process.env.ESTONIAN_PRICE_CONCURRENCY ?? "6", 10);
  const concurrency = Number.isFinite(concurrencyRaw) ? Math.max(1, concurrencyRaw) : 6;

  const targets = components.slice(0, limit);
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  await runWithConcurrency(targets, concurrency, async (component) => {
    const quote = await fetchEstonianSourcePrice(component.name, component.basePriceEur);
    if (!quote) {
      skipped += 1;
      return;
    }

    const marketAvg = Number(quote.price.toFixed(2));
    const finalPrice = Number((marketAvg * (1 + ASSEMBLY_MARKUP / 100)).toFixed(2));

    try {
      upsertEstonianPriceCheck({
        category: component.category,
        itemId: component.itemId,
        itemName: component.name,
        basePriceEur: component.basePriceEur,
        marketAvgEur: marketAvg,
        assemblyMarkupPct: ASSEMBLY_MARKUP,
        finalPriceEur: finalPrice,
        sampleCount: 1,
        sources: quote.source,
      });
      updated += 1;
    } catch {
      failed += 1;
    }
  });

  return {
    checked: targets.length,
    updated,
    skipped,
    failed,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}
