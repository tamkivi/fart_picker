import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type UserRole = "ADMIN" | "DEV" | "USER";

export type GpuRecord = {
  id: number;
  name: string;
  brand: string;
  vram_gb: number;
  architecture: string;
  ai_score: number;
  price_eur: number;
};

export type CpuRecord = {
  id: number;
  name: string;
  brand: string;
  cores: number;
  threads: number;
  socket: string;
  ai_score: number;
  price_eur: number;
};

export type PrebuiltRecord = {
  id: number;
  name: string;
  vendor: string;
  description: string;
  ram_gb: number;
  storage_gb: number;
  llm_max_model_size: string;
  price_eur: number;
  in_stock: number;
  cpu_name: string;
  gpu_name: string;
};

export type ProfileBuildRecord = {
  id: number;
  profile_key: string;
  profile_label: string;
  build_name: string;
  target_model: string;
  ram_gb: number;
  storage_gb: number;
  estimated_price_eur: number;
  notes: string;
  source_refs: string;
  cpu_name: string;
  gpu_name: string;
};

type DbUserRecord = {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
};

export type PublicUser = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type AccountSummary = {
  total: number;
  admins: number;
  devs: number;
  users: number;
};

const globalForCatalogDb = globalThis as unknown as {
  catalogDb: DatabaseSync | undefined;
};

const SESSION_DAYS = 7;
const ADMIN_EMAIL = "gustavpaul@tamkivi.com";

function toPublicUser(user: DbUserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedKey = Buffer.from(keyHex, "hex");
  const candidateKey = scryptSync(password, salt, expectedKey.length);

  return timingSafeEqual(expectedKey, candidateKey);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

function expiresAt(days: number): string {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return until.toISOString();
}

function hasColumn(db: DatabaseSync, tableName: string, columnName: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return columns.some((column) => column.name === columnName);
}

function ensureEuroPriceColumns(db: DatabaseSync): void {
  if (!hasColumn(db, "gpus", "price_eur")) {
    db.exec("ALTER TABLE gpus ADD COLUMN price_eur INTEGER;");
  }
  if (!hasColumn(db, "cpus", "price_eur")) {
    db.exec("ALTER TABLE cpus ADD COLUMN price_eur INTEGER;");
  }
  if (!hasColumn(db, "prebuilts", "price_eur")) {
    db.exec("ALTER TABLE prebuilts ADD COLUMN price_eur INTEGER;");
  }
  if (!hasColumn(db, "profile_builds", "estimated_price_eur")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN estimated_price_eur INTEGER;");
  }

  if (hasColumn(db, "gpus", "price_usd")) {
    db.exec("UPDATE gpus SET price_eur = COALESCE(price_eur, ROUND(price_usd * 0.84));");
  }
  if (hasColumn(db, "cpus", "price_usd")) {
    db.exec("UPDATE cpus SET price_eur = COALESCE(price_eur, ROUND(price_usd * 0.84));");
  }
  if (hasColumn(db, "prebuilts", "price_usd")) {
    db.exec("UPDATE prebuilts SET price_eur = COALESCE(price_eur, ROUND(price_usd * 0.84));");
  }
  if (hasColumn(db, "profile_builds", "estimated_price_usd")) {
    db.exec("UPDATE profile_builds SET estimated_price_eur = COALESCE(estimated_price_eur, ROUND(estimated_price_usd * 0.84));");
  }
}

function ensureGpu(
  db: DatabaseSync,
  gpu: {
    name: string;
    brand: string;
    vramGb: number;
    architecture: string;
    tdpWatts: number;
    aiScore: number;
    priceEur: number;
  },
): number {
  const hasLegacyUsd = hasColumn(db, "gpus", "price_usd");
  const existing = db.prepare("SELECT id FROM gpus WHERE name = ? LIMIT 1").get(gpu.name) as { id: number } | undefined;
  if (existing) {
    if (hasLegacyUsd) {
      db.prepare(
        "UPDATE gpus SET brand = ?, vram_gb = ?, architecture = ?, tdp_watts = ?, ai_score = ?, price_eur = ?, price_usd = ? WHERE id = ?",
      ).run(
        gpu.brand,
        gpu.vramGb,
        gpu.architecture,
        gpu.tdpWatts,
        gpu.aiScore,
        gpu.priceEur,
        Math.round(gpu.priceEur / 0.84),
        existing.id,
      );
    } else {
      db.prepare(
        "UPDATE gpus SET brand = ?, vram_gb = ?, architecture = ?, tdp_watts = ?, ai_score = ?, price_eur = ? WHERE id = ?",
      ).run(gpu.brand, gpu.vramGb, gpu.architecture, gpu.tdpWatts, gpu.aiScore, gpu.priceEur, existing.id);
    }
    return existing.id;
  }

  if (hasLegacyUsd) {
    db.prepare(
      "INSERT INTO gpus (name, brand, vram_gb, architecture, tdp_watts, ai_score, price_eur, price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      gpu.name,
      gpu.brand,
      gpu.vramGb,
      gpu.architecture,
      gpu.tdpWatts,
      gpu.aiScore,
      gpu.priceEur,
      Math.round(gpu.priceEur / 0.84),
    );
  } else {
    db.prepare(
      "INSERT INTO gpus (name, brand, vram_gb, architecture, tdp_watts, ai_score, price_eur) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(gpu.name, gpu.brand, gpu.vramGb, gpu.architecture, gpu.tdpWatts, gpu.aiScore, gpu.priceEur);
  }

  const inserted = db.prepare("SELECT id FROM gpus WHERE name = ? LIMIT 1").get(gpu.name) as { id: number };
  return inserted.id;
}

function ensureCpu(
  db: DatabaseSync,
  cpu: {
    name: string;
    brand: string;
    cores: number;
    threads: number;
    baseClockGhz: number;
    boostClockGhz: number;
    socket: string;
    tdpWatts: number;
    aiScore: number;
    priceEur: number;
  },
): number {
  const hasLegacyUsd = hasColumn(db, "cpus", "price_usd");
  const existing = db.prepare("SELECT id FROM cpus WHERE name = ? LIMIT 1").get(cpu.name) as { id: number } | undefined;
  if (existing) {
    if (hasLegacyUsd) {
      db.prepare(
        "UPDATE cpus SET brand = ?, cores = ?, threads = ?, base_clock_ghz = ?, boost_clock_ghz = ?, socket = ?, tdp_watts = ?, ai_score = ?, price_eur = ?, price_usd = ? WHERE id = ?",
      ).run(
        cpu.brand,
        cpu.cores,
        cpu.threads,
        cpu.baseClockGhz,
        cpu.boostClockGhz,
        cpu.socket,
        cpu.tdpWatts,
        cpu.aiScore,
        cpu.priceEur,
        Math.round(cpu.priceEur / 0.84),
        existing.id,
      );
    } else {
      db.prepare(
        "UPDATE cpus SET brand = ?, cores = ?, threads = ?, base_clock_ghz = ?, boost_clock_ghz = ?, socket = ?, tdp_watts = ?, ai_score = ?, price_eur = ? WHERE id = ?",
      ).run(
        cpu.brand,
        cpu.cores,
        cpu.threads,
        cpu.baseClockGhz,
        cpu.boostClockGhz,
        cpu.socket,
        cpu.tdpWatts,
        cpu.aiScore,
        cpu.priceEur,
        existing.id,
      );
    }
    return existing.id;
  }

  if (hasLegacyUsd) {
    db.prepare(
      "INSERT INTO cpus (name, brand, cores, threads, base_clock_ghz, boost_clock_ghz, socket, tdp_watts, ai_score, price_eur, price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      cpu.name,
      cpu.brand,
      cpu.cores,
      cpu.threads,
      cpu.baseClockGhz,
      cpu.boostClockGhz,
      cpu.socket,
      cpu.tdpWatts,
      cpu.aiScore,
      cpu.priceEur,
      Math.round(cpu.priceEur / 0.84),
    );
  } else {
    db.prepare(
      "INSERT INTO cpus (name, brand, cores, threads, base_clock_ghz, boost_clock_ghz, socket, tdp_watts, ai_score, price_eur) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      cpu.name,
      cpu.brand,
      cpu.cores,
      cpu.threads,
      cpu.baseClockGhz,
      cpu.boostClockGhz,
      cpu.socket,
      cpu.tdpWatts,
      cpu.aiScore,
      cpu.priceEur,
    );
  }

  const inserted = db.prepare("SELECT id FROM cpus WHERE name = ? LIMIT 1").get(cpu.name) as { id: number };
  return inserted.id;
}

function ensurePrebuilt(
  db: DatabaseSync,
  prebuilt: {
    name: string;
    vendor: string;
    description: string;
    priceEur: number;
    ramGb: number;
    storageGb: number;
    llmMaxModelSize: string;
    inStock: number;
    cpuId: number;
    gpuId: number;
  },
): void {
  const hasLegacyUsd = hasColumn(db, "prebuilts", "price_usd");
  const existing = db.prepare("SELECT id FROM prebuilts WHERE name = ? LIMIT 1").get(prebuilt.name) as
    | { id: number }
    | undefined;
  if (existing) {
    if (hasLegacyUsd) {
      db.prepare(
        "UPDATE prebuilts SET vendor = ?, description = ?, price_eur = ?, price_usd = ?, ram_gb = ?, storage_gb = ?, llm_max_model_size = ?, in_stock = ?, cpu_id = ?, gpu_id = ? WHERE id = ?",
      ).run(
        prebuilt.vendor,
        prebuilt.description,
        prebuilt.priceEur,
        Math.round(prebuilt.priceEur / 0.84),
        prebuilt.ramGb,
        prebuilt.storageGb,
        prebuilt.llmMaxModelSize,
        prebuilt.inStock,
        prebuilt.cpuId,
        prebuilt.gpuId,
        existing.id,
      );
    } else {
      db.prepare(
        "UPDATE prebuilts SET vendor = ?, description = ?, price_eur = ?, ram_gb = ?, storage_gb = ?, llm_max_model_size = ?, in_stock = ?, cpu_id = ?, gpu_id = ? WHERE id = ?",
      ).run(
        prebuilt.vendor,
        prebuilt.description,
        prebuilt.priceEur,
        prebuilt.ramGb,
        prebuilt.storageGb,
        prebuilt.llmMaxModelSize,
        prebuilt.inStock,
        prebuilt.cpuId,
        prebuilt.gpuId,
        existing.id,
      );
    }
    return;
  }

  if (hasLegacyUsd) {
    db.prepare(
      "INSERT INTO prebuilts (name, vendor, description, price_eur, price_usd, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      prebuilt.name,
      prebuilt.vendor,
      prebuilt.description,
      prebuilt.priceEur,
      Math.round(prebuilt.priceEur / 0.84),
      prebuilt.ramGb,
      prebuilt.storageGb,
      prebuilt.llmMaxModelSize,
      prebuilt.inStock,
      prebuilt.cpuId,
      prebuilt.gpuId,
    );
  } else {
    db.prepare(
      "INSERT INTO prebuilts (name, vendor, description, price_eur, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      prebuilt.name,
      prebuilt.vendor,
      prebuilt.description,
      prebuilt.priceEur,
      prebuilt.ramGb,
      prebuilt.storageGb,
      prebuilt.llmMaxModelSize,
      prebuilt.inStock,
      prebuilt.cpuId,
      prebuilt.gpuId,
    );
  }
}

function seedCatalog(db: DatabaseSync): void {
  const gpuSeed = [
    {
      name: "NVIDIA RTX 4090",
      brand: "NVIDIA",
      vramGb: 24,
      architecture: "Ada Lovelace",
      tdpWatts: 450,
      aiScore: 99,
      priceEur: 1549,
    },
    {
      name: "NVIDIA RTX 4080 SUPER",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 320,
      aiScore: 92,
      priceEur: 949,
    },
    {
      name: "NVIDIA RTX 4070 Ti SUPER",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 285,
      aiScore: 88,
      priceEur: 769,
    },
    {
      name: "NVIDIA RTX 4070 SUPER",
      brand: "NVIDIA",
      vramGb: 12,
      architecture: "Ada Lovelace",
      tdpWatts: 220,
      aiScore: 84,
      priceEur: 619,
    },
    {
      name: "NVIDIA RTX 4070",
      brand: "NVIDIA",
      vramGb: 12,
      architecture: "Ada Lovelace",
      tdpWatts: 200,
      aiScore: 81,
      priceEur: 569,
    },
    {
      name: "AMD Radeon RX 7900 XTX",
      brand: "AMD",
      vramGb: 24,
      architecture: "RDNA 3",
      tdpWatts: 355,
      aiScore: 86,
      priceEur: 939,
    },
    {
      name: "AMD Radeon RX 7900 XT",
      brand: "AMD",
      vramGb: 20,
      architecture: "RDNA 3",
      tdpWatts: 300,
      aiScore: 82,
      priceEur: 859,
    },
    {
      name: "AMD Radeon RX 7800 XT",
      brand: "AMD",
      vramGb: 16,
      architecture: "RDNA 3",
      tdpWatts: 263,
      aiScore: 78,
      priceEur: 529,
    },
    {
      name: "AMD Radeon RX 7700 XT",
      brand: "AMD",
      vramGb: 12,
      architecture: "RDNA 3",
      tdpWatts: 245,
      aiScore: 72,
      priceEur: 459,
    },
    {
      name: "NVIDIA RTX 4060 Ti 16GB",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 160,
      aiScore: 73,
      priceEur: 479,
    },
    {
      name: "NVIDIA RTX 4060",
      brand: "NVIDIA",
      vramGb: 8,
      architecture: "Ada Lovelace",
      tdpWatts: 115,
      aiScore: 64,
      priceEur: 319,
    },
    {
      name: "AMD Radeon RX 7600 XT",
      brand: "AMD",
      vramGb: 16,
      architecture: "RDNA 3",
      tdpWatts: 190,
      aiScore: 66,
      priceEur: 329,
    },
    {
      name: "NVIDIA RTX 3090",
      brand: "NVIDIA",
      vramGb: 24,
      architecture: "Ampere",
      tdpWatts: 350,
      aiScore: 83,
      priceEur: 1149,
    },
  ];

  const cpuSeed = [
    {
      name: "AMD Ryzen 9 7950X",
      brand: "AMD",
      cores: 16,
      threads: 32,
      baseClockGhz: 4.5,
      boostClockGhz: 5.7,
      socket: "AM5",
      tdpWatts: 170,
      aiScore: 95,
      priceEur: 649,
    },
    {
      name: "AMD Ryzen 9 7900",
      brand: "AMD",
      cores: 12,
      threads: 24,
      baseClockGhz: 3.7,
      boostClockGhz: 5.4,
      socket: "AM5",
      tdpWatts: 65,
      aiScore: 88,
      priceEur: 399,
    },
    {
      name: "AMD Ryzen 9 7900X",
      brand: "AMD",
      cores: 12,
      threads: 24,
      baseClockGhz: 4.7,
      boostClockGhz: 5.6,
      socket: "AM5",
      tdpWatts: 170,
      aiScore: 90,
      priceEur: 509,
    },
    {
      name: "AMD Ryzen 7 7800X3D",
      brand: "AMD",
      cores: 8,
      threads: 16,
      baseClockGhz: 4.2,
      boostClockGhz: 5.0,
      socket: "AM5",
      tdpWatts: 120,
      aiScore: 82,
      priceEur: 369,
    },
    {
      name: "AMD Ryzen 7 7700",
      brand: "AMD",
      cores: 8,
      threads: 16,
      baseClockGhz: 3.8,
      boostClockGhz: 5.3,
      socket: "AM5",
      tdpWatts: 65,
      aiScore: 78,
      priceEur: 289,
    },
    {
      name: "AMD Ryzen 5 7600",
      brand: "AMD",
      cores: 6,
      threads: 12,
      baseClockGhz: 3.8,
      boostClockGhz: 5.1,
      socket: "AM5",
      tdpWatts: 65,
      aiScore: 70,
      priceEur: 209,
    },
    {
      name: "Intel Core i9-14900K",
      brand: "Intel",
      cores: 24,
      threads: 32,
      baseClockGhz: 3.2,
      boostClockGhz: 6.0,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 93,
      priceEur: 559,
    },
    {
      name: "Intel Core i7-14700K",
      brand: "Intel",
      cores: 20,
      threads: 28,
      baseClockGhz: 3.4,
      boostClockGhz: 5.6,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 87,
      priceEur: 389,
    },
    {
      name: "Intel Core i5-14600K",
      brand: "Intel",
      cores: 14,
      threads: 20,
      baseClockGhz: 3.5,
      boostClockGhz: 5.3,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 76,
      priceEur: 319,
    },
    {
      name: "Intel Core i7-13700K",
      brand: "Intel",
      cores: 16,
      threads: 24,
      baseClockGhz: 3.4,
      boostClockGhz: 5.4,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 83,
      priceEur: 349,
    },
    {
      name: "Intel Core i9-13900K",
      brand: "Intel",
      cores: 24,
      threads: 32,
      baseClockGhz: 3.0,
      boostClockGhz: 5.8,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 89,
      priceEur: 499,
    },
  ];

  gpuSeed.forEach((gpu) => {
    ensureGpu(db, gpu);
  });

  cpuSeed.forEach((cpu) => {
    ensureCpu(db, cpu);
  });

  const cpu7900 = db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900' LIMIT 1").get() as { id: number };
  const cpu7950x = db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7950X' LIMIT 1").get() as { id: number };
  const cpui9 = db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i9-14900K' LIMIT 1").get() as { id: number };
  const cpui7 = db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i7-14700K' LIMIT 1").get() as { id: number };
  const cpui5 = db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i5-14600K' LIMIT 1").get() as { id: number };
  const cpu7800x3d = db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 7 7800X3D' LIMIT 1").get() as { id: number };

  const gpu4080s = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4080 SUPER' LIMIT 1").get() as { id: number };
  const gpu4090 = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4090' LIMIT 1").get() as { id: number };
  const gpu4070ti = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4070 Ti SUPER' LIMIT 1").get() as { id: number };
  const gpu4070s = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4070 SUPER' LIMIT 1").get() as { id: number };
  const gpu7900xtx = db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7900 XTX' LIMIT 1").get() as { id: number };
  const gpu7800xt = db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7800 XT' LIMIT 1").get() as { id: number };
  const gpu4060ti = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4060 Ti 16GB' LIMIT 1").get() as { id: number };

  ensurePrebuilt(db, {
    name: "Nebula Forge XL",
    vendor: "fart_picker Labs",
    description: "High-end local LLM workstation for 34B+ quantized models.",
    priceEur: 3349,
    ramGb: 128,
    storageGb: 4000,
    llmMaxModelSize: "70B q4 (select workloads)",
    inStock: 1,
    cpuId: cpu7950x.id,
    gpuId: gpu4090.id,
  });
  ensurePrebuilt(db, {
    name: "Vector Home Pro",
    vendor: "fart_picker Labs",
    description: "Balanced AI dev tower for daily coding and local inference.",
    priceEur: 2099,
    ramGb: 64,
    storageGb: 2000,
    llmMaxModelSize: "34B q4",
    inStock: 1,
    cpuId: cpu7900.id,
    gpuId: gpu4080s.id,
  });
  ensurePrebuilt(db, {
    name: "Redline Studio AI",
    vendor: "fart_picker Labs",
    description: "VRAM-heavy AMD option for open-source inference stacks.",
    priceEur: 1999,
    ramGb: 64,
    storageGb: 2000,
    llmMaxModelSize: "30B q4",
    inStock: 1,
    cpuId: cpui9.id,
    gpuId: gpu7900xtx.id,
  });
  ensurePrebuilt(db, {
    name: "Creator Edge 16",
    vendor: "fart_picker Labs",
    description: "Creator/gaming hybrid with strong CUDA inference support.",
    priceEur: 1899,
    ramGb: 64,
    storageGb: 2000,
    llmMaxModelSize: "30B q4",
    inStock: 1,
    cpuId: cpui7.id,
    gpuId: gpu4070ti.id,
  });
  ensurePrebuilt(db, {
    name: "Inference Compact",
    vendor: "fart_picker Labs",
    description: "Power-efficient desktop for 7B-13B local models.",
    priceEur: 1329,
    ramGb: 32,
    storageGb: 1000,
    llmMaxModelSize: "13B q4",
    inStock: 1,
    cpuId: cpui5.id,
    gpuId: gpu4060ti.id,
  });
  ensurePrebuilt(db, {
    name: "Raster AI Midrange",
    vendor: "fart_picker Labs",
    description: "Balanced AMD raster and local inference setup.",
    priceEur: 1599,
    ramGb: 64,
    storageGb: 2000,
    llmMaxModelSize: "20B q4",
    inStock: 1,
    cpuId: cpu7800x3d.id,
    gpuId: gpu7800xt.id,
  });
  ensurePrebuilt(db, {
    name: "Stable Dev Box",
    vendor: "fart_picker Labs",
    description: "Reliable day-to-day AI coding machine with quiet thermals.",
    priceEur: 1749,
    ramGb: 64,
    storageGb: 2000,
    llmMaxModelSize: "20B q4",
    inStock: 1,
    cpuId: cpu7900.id,
    gpuId: gpu4070s.id,
  });
}

function seedProfileBuilds(db: DatabaseSync): void {
  const ids = {
    cpu7950x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7950X' LIMIT 1").get() as { id: number }).id,
    cpu7900: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900' LIMIT 1").get() as { id: number }).id,
    cpu7900x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900X' LIMIT 1").get() as { id: number }).id,
    cpui9: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i9-14900K' LIMIT 1").get() as { id: number }).id,
    cpui7: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i7-14700K' LIMIT 1").get() as { id: number }).id,
    gpu4090: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4090' LIMIT 1").get() as { id: number }).id,
    gpu4080s: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4080 SUPER' LIMIT 1").get() as { id: number }).id,
    gpu4070tis: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4070 Ti SUPER' LIMIT 1").get() as {
      id: number;
    }).id,
    gpu7900xtx: (db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7900 XTX' LIMIT 1").get() as {
      id: number;
    }).id,
    gpu7900xt: (db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7900 XT' LIMIT 1").get() as {
      id: number;
    }).id,
    gpu4060ti16: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4060 Ti 16GB' LIMIT 1").get() as {
      id: number;
    }).id,
    gpu4070s: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4070 SUPER' LIMIT 1").get() as { id: number })
      .id,
    gpu7800xt: (db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7800 XT' LIMIT 1").get() as { id: number })
      .id,
    cpui5: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i5-14600K' LIMIT 1").get() as { id: number }).id,
    cpu7800x3d: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 7 7800X3D' LIMIT 1").get() as { id: number })
      .id,
  };

  const buildRows: Array<{
    profileKey: string;
    profileLabel: string;
    buildName: string;
    targetModel: string;
    ramGb: number;
    storageGb: number;
    estimatedPriceEur: number;
    notes: string;
    sourceRefs: string;
    cpuId: number;
    gpuId: number;
  }> = [
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Flagship 24GB CUDA Inference",
      targetModel: "70B q4 (select workloads)",
      ramGb: 128,
      storageGb: 4000,
      estimatedPriceEur: 3349,
      notes: "Highest VRAM headroom for local quantized models and long sessions.",
      sourceRefs:
        "GPU data: nvidia.com RTX 4090 specs; CPU data: ir.amd.com Ryzen 7000 launch (7950X).",
      cpuId: ids.cpu7950x,
      gpuId: ids.gpu4090,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Balanced NVIDIA 16GB",
      targetModel: "34B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 2099,
      notes: "Strong tokens/sec per dollar while keeping CUDA ecosystem compatibility.",
      sourceRefs:
        "GPU data: nvidia.com RTX 4080 SUPER specs; CPU data: ir.amd.com Ryzen 7000 non-X launch (7900).",
      cpuId: ids.cpu7900,
      gpuId: ids.gpu4080s,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "24GB VRAM Value (ROCm path)",
      targetModel: "34B q4 / 70B split workloads",
      ramGb: 96,
      storageGb: 2000,
      estimatedPriceEur: 2249,
      notes: "Maximizes VRAM at lower entry cost if your stack supports ROCm.",
      sourceRefs:
        "GPU data: amd.com RX 7900 launch specs; CPU data: intel.com i7-14700K specs.",
      cpuId: ids.cpui7,
      gpuId: ids.gpu7900xtx,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "CUDA Adapter-Tuning Starter",
      targetModel: "7B-13B LoRA",
      ramGb: 96,
      storageGb: 2000,
      estimatedPriceEur: 2399,
      notes: "Good memory + CUDA path for LoRA/QLoRA learning and experimentation.",
      sourceRefs:
        "GPU data: nvidia.com RTX 4070 Ti SUPER family specs; CPU data: ir.amd.com Ryzen 7000 launch (7950X).",
      cpuId: ids.cpu7950x,
      gpuId: ids.gpu4070tis,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Budget Fine-Tune Entry",
      targetModel: "7B LoRA / embedding workloads",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1599,
      notes: "Lowest-cost option for learning workflows and light local AI development.",
      sourceRefs:
        "GPU data: nvidia.com RTX 4060 Ti family + launch pricing news; CPU data: ir.amd.com Ryzen 7900 announcement.",
      cpuId: ids.cpu7900,
      gpuId: ids.gpu4060ti16,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "ROCm-Friendly Fine-Tune",
      targetModel: "13B LoRA / mixed inference",
      ramGb: 96,
      storageGb: 2000,
      estimatedPriceEur: 2299,
      notes: "Higher memory footprint and strong multicore CPU for data prep + training loops.",
      sourceRefs: "GPU data: amd.com RX 7900 XT specs; CPU data: intel.com i9-14900K specs.",
      cpuId: ids.cpui9,
      gpuId: ids.gpu7900xt,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "4K Hybrid Flagship",
      targetModel: "34B q4 + high-end 4K gaming",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 2499,
      notes: "Strong creator and gaming performance with robust local AI throughput.",
      sourceRefs: "GPU data: nvidia.com RTX 4080 SUPER specs; CPU data: intel.com i9-14900K specs.",
      cpuId: ids.cpui9,
      gpuId: ids.gpu4080s,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "1440p AI Creator",
      targetModel: "13B-34B q4 + high refresh gaming",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1969,
      notes: "Great 1440p gaming and local inference with lower power than flagship setups.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 Ti SUPER specs; CPU data: intel.com i7-14700K specs.",
      cpuId: ids.cpui7,
      gpuId: ids.gpu4070tis,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "Raster + LLM Value",
      targetModel: "30B-34B q4 + raster-heavy gaming",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 2049,
      notes: "High VRAM plus solid gaming value for users open to AMD GPU tooling.",
      sourceRefs: "GPU data: amd.com RX 7900 XTX specs; CPU data: ir.amd.com Ryzen 7000 non-X launch.",
      cpuId: ids.cpu7900x,
      gpuId: ids.gpu7900xtx,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Efficient 20B Workstation",
      targetModel: "20B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1749,
      notes: "Lower total power while retaining strong CUDA compatibility.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 SUPER specs; CPU data: intel.com i5-14600K specs.",
      cpuId: ids.cpui5,
      gpuId: ids.gpu4070s,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "AMD Value 16GB Inference",
      targetModel: "13B-20B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1599,
      notes: "Budget-friendly entry with 16GB VRAM and strong raster value.",
      sourceRefs: "GPU data: amd.com RX 7800 XT specs; CPU data: ir.amd.com Ryzen 7700 launch details.",
      cpuId: ids.cpu7900,
      gpuId: ids.gpu7800xt,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Low-Power Fine-Tune Lab",
      targetModel: "7B LoRA + embeddings",
      ramGb: 64,
      storageGb: 1000,
      estimatedPriceEur: 1499,
      notes: "Cheaper tuning starter for notebooks-to-desktop transition users.",
      sourceRefs: "GPU data: nvidia.com RTX 4060 Ti 16GB specs; CPU data: intel.com i5-14600K specs.",
      cpuId: ids.cpui5,
      gpuId: ids.gpu4060ti16,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Midrange CUDA Tuning",
      targetModel: "13B LoRA",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1899,
      notes: "Balanced setup for repeated experiments and multi-project workflows.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 SUPER specs; CPU data: intel.com i7-14700K specs.",
      cpuId: ids.cpui7,
      gpuId: ids.gpu4070s,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "eSports + AI Efficiency",
      targetModel: "13B q4 + high fps 1080p/1440p",
      ramGb: 32,
      storageGb: 1000,
      estimatedPriceEur: 1349,
      notes: "Entry hybrid machine with low power draw and fast iteration.",
      sourceRefs: "GPU data: nvidia.com RTX 4060 family specs; CPU data: intel.com i5-14600K specs.",
      cpuId: ids.cpui5,
      gpuId: ids.gpu4060ti16,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "AMD Gaming + Inference",
      targetModel: "20B q4 + strong raster 1440p",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1799,
      notes: "Good gaming value and enough VRAM for mid-size local models.",
      sourceRefs: "GPU data: amd.com RX 7800 XT specs; CPU data: amd.com Ryzen 7800X3D specs.",
      cpuId: ids.cpu7800x3d,
      gpuId: ids.gpu7800xt,
    },
  ];

  const hasLegacyUsd = hasColumn(db, "profile_builds", "estimated_price_usd");
  const insertStatement = hasLegacyUsd
    ? db.prepare(
        "INSERT INTO profile_builds (profile_key, profile_label, build_name, target_model, ram_gb, storage_gb, estimated_price_eur, estimated_price_usd, notes, source_refs, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_key, build_name) DO UPDATE SET profile_label=excluded.profile_label, target_model=excluded.target_model, ram_gb=excluded.ram_gb, storage_gb=excluded.storage_gb, estimated_price_eur=excluded.estimated_price_eur, estimated_price_usd=excluded.estimated_price_usd, notes=excluded.notes, source_refs=excluded.source_refs, cpu_id=excluded.cpu_id, gpu_id=excluded.gpu_id",
      )
    : db.prepare(
        "INSERT INTO profile_builds (profile_key, profile_label, build_name, target_model, ram_gb, storage_gb, estimated_price_eur, notes, source_refs, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_key, build_name) DO UPDATE SET profile_label=excluded.profile_label, target_model=excluded.target_model, ram_gb=excluded.ram_gb, storage_gb=excluded.storage_gb, estimated_price_eur=excluded.estimated_price_eur, notes=excluded.notes, source_refs=excluded.source_refs, cpu_id=excluded.cpu_id, gpu_id=excluded.gpu_id",
      );

  buildRows.forEach((build) => {
    if (hasLegacyUsd) {
      insertStatement.run(
        build.profileKey,
        build.profileLabel,
        build.buildName,
        build.targetModel,
        build.ramGb,
        build.storageGb,
        build.estimatedPriceEur,
        Math.round(build.estimatedPriceEur / 0.84),
        build.notes,
        build.sourceRefs,
        build.cpuId,
        build.gpuId,
      );
    } else {
      insertStatement.run(
        build.profileKey,
        build.profileLabel,
        build.buildName,
        build.targetModel,
        build.ramGb,
        build.storageGb,
        build.estimatedPriceEur,
        build.notes,
        build.sourceRefs,
        build.cpuId,
        build.gpuId,
      );
    }
  });
}

function initDatabase(): DatabaseSync {
  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(join(dataDir, "catalog.db"));
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS gpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      vram_gb INTEGER NOT NULL,
      architecture TEXT NOT NULL,
      tdp_watts INTEGER NOT NULL,
      ai_score INTEGER NOT NULL,
      price_eur INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      cores INTEGER NOT NULL,
      threads INTEGER NOT NULL,
      base_clock_ghz REAL NOT NULL,
      boost_clock_ghz REAL NOT NULL,
      socket TEXT NOT NULL,
      tdp_watts INTEGER NOT NULL,
      ai_score INTEGER NOT NULL,
      price_eur INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prebuilts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      description TEXT NOT NULL,
      price_eur INTEGER NOT NULL,
      ram_gb INTEGER NOT NULL,
      storage_gb INTEGER NOT NULL,
      llm_max_model_size TEXT NOT NULL,
      in_stock INTEGER NOT NULL DEFAULT 1,
      cpu_id INTEGER NOT NULL,
      gpu_id INTEGER NOT NULL,
      FOREIGN KEY (cpu_id) REFERENCES cpus(id),
      FOREIGN KEY (gpu_id) REFERENCES gpus(id)
    );

    CREATE TABLE IF NOT EXISTS profile_builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_key TEXT NOT NULL,
      profile_label TEXT NOT NULL,
      build_name TEXT NOT NULL,
      target_model TEXT NOT NULL,
      ram_gb INTEGER NOT NULL,
      storage_gb INTEGER NOT NULL,
      estimated_price_eur INTEGER NOT NULL,
      notes TEXT NOT NULL,
      source_refs TEXT NOT NULL,
      cpu_id INTEGER NOT NULL,
      gpu_id INTEGER NOT NULL,
      FOREIGN KEY (cpu_id) REFERENCES cpus(id),
      FOREIGN KEY (gpu_id) REFERENCES gpus(id),
      UNIQUE(profile_key, build_name)
    );

    CREATE INDEX IF NOT EXISTS idx_profile_builds_profile_key ON profile_builds(profile_key);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'DEV', 'USER')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      invalidated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  ensureEuroPriceColumns(db);
  seedCatalog(db);
  seedProfileBuilds(db);
  return db;
}

function getDb(): DatabaseSync {
  if (!globalForCatalogDb.catalogDb) {
    globalForCatalogDb.catalogDb = initDatabase();
  }
  return globalForCatalogDb.catalogDb;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getUserByEmail(email: string): DbUserRecord | null {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?")
    .get(normalizeEmail(email));
  return (user as DbUserRecord | undefined) ?? null;
}

export function listGpus(): GpuRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT id, name, brand, vram_gb, architecture, ai_score, price_eur FROM gpus ORDER BY ai_score DESC")
    .all() as GpuRecord[];
}

export function listCpus(): CpuRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT id, name, brand, cores, threads, socket, ai_score, price_eur FROM cpus ORDER BY ai_score DESC")
    .all() as CpuRecord[];
}

export function listPrebuilts(): PrebuiltRecord[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT
        p.id,
        p.name,
        p.vendor,
        p.description,
        p.ram_gb,
        p.storage_gb,
        p.llm_max_model_size,
        p.price_eur,
        p.in_stock,
        c.name AS cpu_name,
        g.name AS gpu_name
      FROM prebuilts p
      JOIN cpus c ON c.id = p.cpu_id
      JOIN gpus g ON g.id = p.gpu_id
      ORDER BY p.price_eur DESC
    `)
    .all() as PrebuiltRecord[];
}

export function listProfileBuilds(): ProfileBuildRecord[] {
  const db = getDb();
  return db
    .prepare(`
      SELECT
        pb.id,
        pb.profile_key,
        pb.profile_label,
        pb.build_name,
        pb.target_model,
        pb.ram_gb,
        pb.storage_gb,
        pb.estimated_price_eur,
        pb.notes,
        pb.source_refs,
        c.name AS cpu_name,
        g.name AS gpu_name
      FROM profile_builds pb
      JOIN cpus c ON c.id = pb.cpu_id
      JOIN gpus g ON g.id = pb.gpu_id
      ORDER BY pb.profile_key ASC, pb.estimated_price_eur ASC
    `)
    .all() as ProfileBuildRecord[];
}

export function registerAccount(input: {
  email: string;
  password: string;
  adminSetupCode?: string;
}): { ok: true; user: PublicUser } | { ok: false; message: string } {
  const db = getDb();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email.includes("@")) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (password.length < 12) {
    return { ok: false, message: "Password must be at least 12 characters." };
  }

  const hasExisting = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (hasExisting) {
    return { ok: false, message: "An account with this email already exists." };
  }

  let role: UserRole = "USER";
  if (email === ADMIN_EMAIL) {
    const anyAdmin = db.prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").get() as { id: number } | undefined;
    if (anyAdmin) {
      return { ok: false, message: "Admin account already exists." };
    }

    const adminSetupKey = process.env.ADMIN_SETUP_CODE;
    if (!adminSetupKey || input.adminSetupCode !== adminSetupKey) {
      return { ok: false, message: "Admin setup code is required for the admin account." };
    }

    role = "ADMIN";
  }

  const passwordHash = hashPassword(password);
  db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)").run(email, passwordHash, role);

  const inserted = getUserByEmail(email);
  if (!inserted) {
    return { ok: false, message: "Failed to create account." };
  }

  return { ok: true, user: toPublicUser(inserted) };
}

export function createSessionForCredentials(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): { ok: true; token: string; user: PublicUser; expiresAt: string } | { ok: false; message: string } {
  const db = getDb();
  const user = getUserByEmail(input.email);

  if (!user || !verifyPassword(input.password, user.password_hash)) {
    return { ok: false, message: "Invalid email or password." };
  }

  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiry = expiresAt(SESSION_DAYS);

  db.prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
  ).run(user.id, tokenHash, expiry, input.ipAddress ?? null, input.userAgent ?? null);

  return {
    ok: true,
    token,
    user: toPublicUser(user),
    expiresAt: expiry,
  };
}

export function getUserFromSessionToken(token: string | undefined): PublicUser | null {
  if (!token) {
    return null;
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `
      SELECT u.id, u.email, u.password_hash, u.role, u.created_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.invalidated_at IS NULL
        AND datetime(s.expires_at) > datetime('now')
      LIMIT 1
    `,
    )
    .get(tokenHash);

  return row ? toPublicUser(row as DbUserRecord) : null;
}

export function invalidateSessionToken(token: string | undefined): void {
  if (!token) {
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  db.prepare("UPDATE sessions SET invalidated_at = datetime('now') WHERE token_hash = ?").run(tokenHash);
}

export function getAccountSummary(): AccountSummary {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS admins,
        SUM(CASE WHEN role = 'DEV' THEN 1 ELSE 0 END) AS devs,
        SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) AS users
      FROM users
    `)
    .get() as { total: number; admins: number; devs: number; users: number };

  return {
    total: row.total ?? 0,
    admins: row.admins ?? 0,
    devs: row.devs ?? 0,
    users: row.users ?? 0,
  };
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
