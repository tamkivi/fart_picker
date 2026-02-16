import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";

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

export type RamKitRecord = {
  id: number;
  name: string;
  brand: string;
  capacity_gb: number;
  modules: string;
  ddr_gen: string;
  speed_mt_s: number;
  cas_latency: string;
  profile_support: string;
  price_eur: number;
  source_refs: string;
};

export type PowerSupplyRecord = {
  id: number;
  name: string;
  brand: string;
  wattage: number;
  efficiency_rating: string;
  atx_standard: string;
  modularity: string;
  pcie_5_support: number;
  price_eur: number;
  source_refs: string;
};

export type CaseRecord = {
  id: number;
  name: string;
  brand: string;
  form_factor: string;
  max_gpu_mm: number;
  radiator_support: string;
  included_fans: string;
  price_eur: number;
  source_refs: string;
};

export type MotherboardRecord = {
  id: number;
  name: string;
  brand: string;
  socket: string;
  chipset: string;
  memory_support: string;
  max_memory_gb: number;
  pcie_gen5_support: number;
  price_eur: number;
  source_refs: string;
};

export type CompactAiSystemRecord = {
  id: number;
  name: string;
  vendor: string;
  chip: string;
  memory_gb: number;
  storage_gb: number;
  gpu_class: string;
  installed_software: string;
  best_for: string;
  price_eur: number;
  in_stock: number;
  source_refs: string;
};

export type StorageDriveRecord = {
  id: number;
  name: string;
  brand: string;
  drive_type: string;
  interface: string;
  capacity_gb: number;
  seq_read_mb_s: number;
  endurance_tbw: number;
  price_eur: number;
  source_refs: string;
};

export type CpuCoolerRecord = {
  id: number;
  name: string;
  brand: string;
  cooler_type: string;
  radiator_or_height_mm: number;
  socket_support: string;
  max_tdp_w: number;
  noise_db: string;
  price_eur: number;
  source_refs: string;
};

export type EstonianPriceCheckRecord = {
  id: number;
  category: string;
  item_id: number;
  item_name: string;
  base_price_eur: number;
  market_avg_eur: number;
  assembly_markup_pct: number;
  final_price_eur: number;
  sample_count: number;
  sources: string;
  checked_at: string;
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
  best_for: string;
  estimated_tokens_per_sec: string;
  estimated_system_power_w: number;
  recommended_psu_w: number;
  cooling_profile: string;
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

export type OrderStatus = "PENDING" | "CHECKOUT_CREATED" | "PAID" | "CANCELED" | "FAILED";

export type OrderRecord = {
  id: number;
  user_id: number;
  profile_build_id: number;
  build_name: string;
  amount_eur_cents: number;
  currency: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = OrderRecord;

export type UserOrderListItem = {
  id: number;
  build_name: string;
  amount_eur_cents: number;
  currency: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminOrderListItem = {
  id: number;
  user_id: number;
  user_email: string;
  profile_build_id: number;
  build_name: string;
  amount_eur_cents: number;
  currency: string;
  status: OrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PaidOrderEmailPayload = {
  orderId: number;
  customerEmail: string;
  buildName: string;
  amountEurCents: number;
  createdAt: string;
};

const globalForCatalogDb = globalThis as unknown as {
  catalogDb: DatabaseSync | undefined;
  pgPool: Pool | undefined;
  pgSchemaReady: Promise<void> | undefined;
};

const SESSION_DAYS = 7;
const ADMIN_EMAIL = "gustavpaul@tamkivi.com";

function resolveDataDir(): string {
  if (process.env.FART_PICKER_DATA_DIR) {
    return process.env.FART_PICKER_DATA_DIR;
  }

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "/tmp/fart_picker_data";
  }

  return join(process.cwd(), "data");
}

function shouldUsePersistentSql(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function getPgPool(): Pool {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalForCatalogDb.pgPool) {
    globalForCatalogDb.pgPool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 4,
    });
  }

  return globalForCatalogDb.pgPool;
}

async function ensurePgSchema(): Promise<void> {
  if (!shouldUsePersistentSql()) {
    return;
  }

  if (!globalForCatalogDb.pgSchemaReady) {
    globalForCatalogDb.pgSchemaReady = (async () => {
      const pool = getPgPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('ADMIN', 'DEV', 'USER')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          invalidated_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          profile_build_id INTEGER NOT NULL,
          build_name TEXT NOT NULL,
          amount_eur_cents INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'eur',
          status TEXT NOT NULL CHECK(status IN ('PENDING', 'CHECKOUT_CREATED', 'PAID', 'CANCELED', 'FAILED')) DEFAULT 'PENDING',
          stripe_checkout_session_id TEXT UNIQUE,
          stripe_payment_intent_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_profile_build_id ON orders(profile_build_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

        CREATE TABLE IF NOT EXISTS stripe_webhook_events (
          id SERIAL PRIMARY KEY,
          event_id TEXT NOT NULL UNIQUE,
          event_type TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })();
  }

  await globalForCatalogDb.pgSchemaReady;
}

function rowDateToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value ?? "");
}

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

function ensureProfileBuildDetailColumns(db: DatabaseSync): void {
  if (!hasColumn(db, "profile_builds", "best_for")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN best_for TEXT DEFAULT 'General AI workloads';");
  }
  if (!hasColumn(db, "profile_builds", "estimated_tokens_per_sec")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN estimated_tokens_per_sec TEXT DEFAULT 'n/a';");
  }
  if (!hasColumn(db, "profile_builds", "estimated_system_power_w")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN estimated_system_power_w INTEGER DEFAULT 450;");
  }
  if (!hasColumn(db, "profile_builds", "recommended_psu_w")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN recommended_psu_w INTEGER DEFAULT 750;");
  }
  if (!hasColumn(db, "profile_builds", "cooling_profile")) {
    db.exec("ALTER TABLE profile_builds ADD COLUMN cooling_profile TEXT DEFAULT 'Balanced air cooling';");
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

function ensureRamKit(
  db: DatabaseSync,
  ramKit: {
    name: string;
    brand: string;
    capacityGb: number;
    modules: string;
    ddrGen: string;
    speedMtS: number;
    casLatency: string;
    profileSupport: string;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO ram_kits
      (name, brand, capacity_gb, modules, ddr_gen, speed_mt_s, cas_latency, profile_support, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      capacity_gb = excluded.capacity_gb,
      modules = excluded.modules,
      ddr_gen = excluded.ddr_gen,
      speed_mt_s = excluded.speed_mt_s,
      cas_latency = excluded.cas_latency,
      profile_support = excluded.profile_support,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    ramKit.name,
    ramKit.brand,
    ramKit.capacityGb,
    ramKit.modules,
    ramKit.ddrGen,
    ramKit.speedMtS,
    ramKit.casLatency,
    ramKit.profileSupport,
    ramKit.priceEur,
    ramKit.sourceRefs,
  );
}

function ensurePowerSupply(
  db: DatabaseSync,
  psu: {
    name: string;
    brand: string;
    wattage: number;
    efficiencyRating: string;
    atxStandard: string;
    modularity: string;
    pcie5Support: number;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO power_supplies
      (name, brand, wattage, efficiency_rating, atx_standard, modularity, pcie_5_support, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      wattage = excluded.wattage,
      efficiency_rating = excluded.efficiency_rating,
      atx_standard = excluded.atx_standard,
      modularity = excluded.modularity,
      pcie_5_support = excluded.pcie_5_support,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    psu.name,
    psu.brand,
    psu.wattage,
    psu.efficiencyRating,
    psu.atxStandard,
    psu.modularity,
    psu.pcie5Support,
    psu.priceEur,
    psu.sourceRefs,
  );
}

function ensureCase(
  db: DatabaseSync,
  pcCase: {
    name: string;
    brand: string;
    formFactor: string;
    maxGpuMm: number;
    radiatorSupport: string;
    includedFans: string;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO pc_cases
      (name, brand, form_factor, max_gpu_mm, radiator_support, included_fans, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      form_factor = excluded.form_factor,
      max_gpu_mm = excluded.max_gpu_mm,
      radiator_support = excluded.radiator_support,
      included_fans = excluded.included_fans,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    pcCase.name,
    pcCase.brand,
    pcCase.formFactor,
    pcCase.maxGpuMm,
    pcCase.radiatorSupport,
    pcCase.includedFans,
    pcCase.priceEur,
    pcCase.sourceRefs,
  );
}

function ensureMotherboard(
  db: DatabaseSync,
  motherboard: {
    name: string;
    brand: string;
    socket: string;
    chipset: string;
    memorySupport: string;
    maxMemoryGb: number;
    pcieGen5Support: number;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO motherboards
      (name, brand, socket, chipset, memory_support, max_memory_gb, pcie_gen5_support, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      socket = excluded.socket,
      chipset = excluded.chipset,
      memory_support = excluded.memory_support,
      max_memory_gb = excluded.max_memory_gb,
      pcie_gen5_support = excluded.pcie_gen5_support,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    motherboard.name,
    motherboard.brand,
    motherboard.socket,
    motherboard.chipset,
    motherboard.memorySupport,
    motherboard.maxMemoryGb,
    motherboard.pcieGen5Support,
    motherboard.priceEur,
    motherboard.sourceRefs,
  );
}

function ensureCompactAiSystem(
  db: DatabaseSync,
  compactSystem: {
    name: string;
    vendor: string;
    chip: string;
    memoryGb: number;
    storageGb: number;
    gpuClass: string;
    installedSoftware: string;
    bestFor: string;
    priceEur: number;
    inStock: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO compact_ai_systems
      (name, vendor, chip, memory_gb, storage_gb, gpu_class, installed_software, best_for, price_eur, in_stock, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      vendor = excluded.vendor,
      chip = excluded.chip,
      memory_gb = excluded.memory_gb,
      storage_gb = excluded.storage_gb,
      gpu_class = excluded.gpu_class,
      installed_software = excluded.installed_software,
      best_for = excluded.best_for,
      price_eur = excluded.price_eur,
      in_stock = excluded.in_stock,
      source_refs = excluded.source_refs
  `,
  ).run(
    compactSystem.name,
    compactSystem.vendor,
    compactSystem.chip,
    compactSystem.memoryGb,
    compactSystem.storageGb,
    compactSystem.gpuClass,
    compactSystem.installedSoftware,
    compactSystem.bestFor,
    compactSystem.priceEur,
    compactSystem.inStock,
    compactSystem.sourceRefs,
  );
}

function ensureStorageDrive(
  db: DatabaseSync,
  drive: {
    name: string;
    brand: string;
    driveType: string;
    interface: string;
    capacityGb: number;
    seqReadMbS: number;
    enduranceTbw: number;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO storage_drives
      (name, brand, drive_type, interface, capacity_gb, seq_read_mb_s, endurance_tbw, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      drive_type = excluded.drive_type,
      interface = excluded.interface,
      capacity_gb = excluded.capacity_gb,
      seq_read_mb_s = excluded.seq_read_mb_s,
      endurance_tbw = excluded.endurance_tbw,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    drive.name,
    drive.brand,
    drive.driveType,
    drive.interface,
    drive.capacityGb,
    drive.seqReadMbS,
    drive.enduranceTbw,
    drive.priceEur,
    drive.sourceRefs,
  );
}

function ensureCpuCooler(
  db: DatabaseSync,
  cooler: {
    name: string;
    brand: string;
    coolerType: string;
    radiatorOrHeightMm: number;
    socketSupport: string;
    maxTdpW: number;
    noiseDb: string;
    priceEur: number;
    sourceRefs: string;
  },
): void {
  db.prepare(
    `
    INSERT INTO cpu_coolers
      (name, brand, cooler_type, radiator_or_height_mm, socket_support, max_tdp_w, noise_db, price_eur, source_refs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      brand = excluded.brand,
      cooler_type = excluded.cooler_type,
      radiator_or_height_mm = excluded.radiator_or_height_mm,
      socket_support = excluded.socket_support,
      max_tdp_w = excluded.max_tdp_w,
      noise_db = excluded.noise_db,
      price_eur = excluded.price_eur,
      source_refs = excluded.source_refs
  `,
  ).run(
    cooler.name,
    cooler.brand,
    cooler.coolerType,
    cooler.radiatorOrHeightMm,
    cooler.socketSupport,
    cooler.maxTdpW,
    cooler.noiseDb,
    cooler.priceEur,
    cooler.sourceRefs,
  );
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
    {
      name: "NVIDIA RTX 6000 Ada",
      brand: "NVIDIA",
      vramGb: 48,
      architecture: "Ada Lovelace",
      tdpWatts: 300,
      aiScore: 97,
      priceEur: 6499,
    },
    {
      name: "NVIDIA RTX A5000",
      brand: "NVIDIA",
      vramGb: 24,
      architecture: "Ampere",
      tdpWatts: 230,
      aiScore: 80,
      priceEur: 2199,
    },
    {
      name: "AMD Radeon PRO W7900",
      brand: "AMD",
      vramGb: 48,
      architecture: "RDNA 3",
      tdpWatts: 295,
      aiScore: 89,
      priceEur: 3799,
    },
    {
      name: "Intel Arc A770 16GB",
      brand: "Intel",
      vramGb: 16,
      architecture: "Alchemist",
      tdpWatts: 225,
      aiScore: 61,
      priceEur: 319,
    },
    {
      name: "NVIDIA RTX 4080",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 320,
      aiScore: 90,
      priceEur: 899,
    },
    {
      name: "NVIDIA RTX 3090 Ti",
      brand: "NVIDIA",
      vramGb: 24,
      architecture: "Ampere",
      tdpWatts: 450,
      aiScore: 85,
      priceEur: 1299,
    },
    {
      name: "NVIDIA RTX A6000",
      brand: "NVIDIA",
      vramGb: 48,
      architecture: "Ampere",
      tdpWatts: 300,
      aiScore: 92,
      priceEur: 4799,
    },
    {
      name: "AMD Radeon RX 7900 GRE",
      brand: "AMD",
      vramGb: 16,
      architecture: "RDNA 3",
      tdpWatts: 260,
      aiScore: 76,
      priceEur: 579,
    },
    {
      name: "AMD Radeon PRO W7800",
      brand: "AMD",
      vramGb: 32,
      architecture: "RDNA 3",
      tdpWatts: 260,
      aiScore: 84,
      priceEur: 2499,
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
    {
      name: "AMD Ryzen 9 9950X",
      brand: "AMD",
      cores: 16,
      threads: 32,
      baseClockGhz: 4.3,
      boostClockGhz: 5.7,
      socket: "AM5",
      tdpWatts: 170,
      aiScore: 97,
      priceEur: 739,
    },
    {
      name: "AMD Ryzen 9 9900X",
      brand: "AMD",
      cores: 12,
      threads: 24,
      baseClockGhz: 4.4,
      boostClockGhz: 5.6,
      socket: "AM5",
      tdpWatts: 120,
      aiScore: 91,
      priceEur: 539,
    },
    {
      name: "AMD Ryzen 7 9700X",
      brand: "AMD",
      cores: 8,
      threads: 16,
      baseClockGhz: 3.8,
      boostClockGhz: 5.5,
      socket: "AM5",
      tdpWatts: 65,
      aiScore: 84,
      priceEur: 369,
    },
    {
      name: "AMD Ryzen 5 9600X",
      brand: "AMD",
      cores: 6,
      threads: 12,
      baseClockGhz: 3.9,
      boostClockGhz: 5.4,
      socket: "AM5",
      tdpWatts: 65,
      aiScore: 75,
      priceEur: 289,
    },
    {
      name: "Intel Core Ultra 9 285K",
      brand: "Intel",
      cores: 24,
      threads: 24,
      baseClockGhz: 3.7,
      boostClockGhz: 5.7,
      socket: "LGA1851",
      tdpWatts: 125,
      aiScore: 95,
      priceEur: 679,
    },
    {
      name: "Intel Core Ultra 7 265K",
      brand: "Intel",
      cores: 20,
      threads: 20,
      baseClockGhz: 3.9,
      boostClockGhz: 5.5,
      socket: "LGA1851",
      tdpWatts: 125,
      aiScore: 88,
      priceEur: 479,
    },
    {
      name: "AMD Ryzen 9 7950X3D",
      brand: "AMD",
      cores: 16,
      threads: 32,
      baseClockGhz: 4.2,
      boostClockGhz: 5.7,
      socket: "AM5",
      tdpWatts: 120,
      aiScore: 94,
      priceEur: 699,
    },
    {
      name: "AMD Ryzen 7 7700X",
      brand: "AMD",
      cores: 8,
      threads: 16,
      baseClockGhz: 4.5,
      boostClockGhz: 5.4,
      socket: "AM5",
      tdpWatts: 105,
      aiScore: 79,
      priceEur: 329,
    },
    {
      name: "Intel Core i5-13600K",
      brand: "Intel",
      cores: 14,
      threads: 20,
      baseClockGhz: 3.5,
      boostClockGhz: 5.1,
      socket: "LGA1700",
      tdpWatts: 125,
      aiScore: 74,
      priceEur: 269,
    },
    {
      name: "Intel Core i7-13700",
      brand: "Intel",
      cores: 16,
      threads: 24,
      baseClockGhz: 2.1,
      boostClockGhz: 5.2,
      socket: "LGA1700",
      tdpWatts: 65,
      aiScore: 82,
      priceEur: 349,
    },
    {
      name: "Intel Core i9-14900",
      brand: "Intel",
      cores: 24,
      threads: 32,
      baseClockGhz: 2.0,
      boostClockGhz: 5.8,
      socket: "LGA1700",
      tdpWatts: 65,
      aiScore: 90,
      priceEur: 519,
    },
  ];

  const ramKitSeed = [
    {
      name: "Corsair Vengeance DDR5 64GB 6000 CL30",
      brand: "Corsair",
      capacityGb: 64,
      modules: "2x32GB",
      ddrGen: "DDR5",
      speedMtS: 6000,
      casLatency: "CL30",
      profileSupport: "XMP + EXPO",
      priceEur: 239,
      sourceRefs: "https://www.corsair.com/us/en/p/memory/cmk64gx5m2b6000z30/vengeance-ddr5-memory-64gb-2x32gb-ddr5-6000mts-cl30-amd-expo-cmk64gx5m2b6000z30",
    },
    {
      name: "G.Skill Trident Z5 Neo RGB 64GB 6000 CL30",
      brand: "G.Skill",
      capacityGb: 64,
      modules: "2x32GB",
      ddrGen: "DDR5",
      speedMtS: 6000,
      casLatency: "CL30",
      profileSupport: "EXPO",
      priceEur: 259,
      sourceRefs: "https://www.gskill.com/product/165/390/1692584545/F5-6000J3040G32GX2-TZ5NR",
    },
    {
      name: "Kingston Fury Beast DDR5 96GB 6000 CL36",
      brand: "Kingston",
      capacityGb: 96,
      modules: "2x48GB",
      ddrGen: "DDR5",
      speedMtS: 6000,
      casLatency: "CL36",
      profileSupport: "XMP + EXPO",
      priceEur: 379,
      sourceRefs: "https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr5-memory",
    },
    {
      name: "Crucial Pro DDR5 96GB 5600",
      brand: "Crucial",
      capacityGb: 96,
      modules: "2x48GB",
      ddrGen: "DDR5",
      speedMtS: 5600,
      casLatency: "CL46",
      profileSupport: "XMP",
      priceEur: 289,
      sourceRefs: "https://www.crucial.com/memory/ddr5/cp2k48g56c46u5",
    },
    {
      name: "Corsair Vengeance DDR5 128GB 5600",
      brand: "Corsair",
      capacityGb: 128,
      modules: "4x32GB",
      ddrGen: "DDR5",
      speedMtS: 5600,
      casLatency: "CL40",
      profileSupport: "XMP",
      priceEur: 429,
      sourceRefs: "https://www.corsair.com/us/en/c/memory",
    },
    {
      name: "G.Skill Trident Z5 RGB 96GB 6400 CL32",
      brand: "G.Skill",
      capacityGb: 96,
      modules: "2x48GB",
      ddrGen: "DDR5",
      speedMtS: 6400,
      casLatency: "CL32",
      profileSupport: "XMP",
      priceEur: 429,
      sourceRefs: "https://www.gskill.com/products/1/165/Desktop-Memory",
    },
    {
      name: "TEAMGROUP T-Create Expert 64GB 6400 CL34",
      brand: "TEAMGROUP",
      capacityGb: 64,
      modules: "2x32GB",
      ddrGen: "DDR5",
      speedMtS: 6400,
      casLatency: "CL34",
      profileSupport: "XMP + EXPO",
      priceEur: 249,
      sourceRefs: "https://www.teamgroupinc.com/en/product/t-create-expert-ddr5-desktop-memory",
    },
    {
      name: "Kingston Fury Renegade DDR5 128GB 6000 CL32",
      brand: "Kingston",
      capacityGb: 128,
      modules: "4x32GB",
      ddrGen: "DDR5",
      speedMtS: 6000,
      casLatency: "CL32",
      profileSupport: "XMP",
      priceEur: 529,
      sourceRefs: "https://www.kingston.com/en/memory/gaming/kingston-fury-renegade-ddr5-memory",
    },
  ];

  const powerSupplySeed = [
    {
      name: "Corsair RM1000x SHIFT",
      brand: "Corsair",
      wattage: 1000,
      efficiencyRating: "80+ Gold",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 229,
      sourceRefs: "https://www.corsair.com/us/en/p/psu/cp-9020253-na/rm1000x-shift-fully-modular-atx-power-supply-cp-9020253-na",
    },
    {
      name: "Seasonic FOCUS GX-850",
      brand: "Seasonic",
      wattage: 850,
      efficiencyRating: "80+ Gold",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 169,
      sourceRefs: "https://seasonic.com/focus-gx",
    },
    {
      name: "be quiet! Straight Power 12 1200W",
      brand: "be quiet!",
      wattage: 1200,
      efficiencyRating: "80+ Platinum",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 279,
      sourceRefs: "https://www.bequiet.com/en/powersupply/straight-power-12/4103",
    },
    {
      name: "Corsair HX1500i",
      brand: "Corsair",
      wattage: 1500,
      efficiencyRating: "80+ Platinum",
      atxStandard: "ATX 3.1",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 399,
      sourceRefs: "https://www.corsair.com/us/en/p/psu/cp-9020281-na/hx1500i-fully-modular-ultra-low-noise-platinum-atx-1500-watt-pc-power-supply-cp-9020281-na",
    },
    {
      name: "MSI MPG A1000G PCIE5",
      brand: "MSI",
      wattage: 1000,
      efficiencyRating: "80+ Gold",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 209,
      sourceRefs: "https://www.msi.com/Power-Supply/MPG-A1000G-PCIE5",
    },
    {
      name: "be quiet! Pure Power 12 M 850W",
      brand: "be quiet!",
      wattage: 850,
      efficiencyRating: "80+ Gold",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 149,
      sourceRefs: "https://www.bequiet.com/en/powersupply/4066",
    },
    {
      name: "Seasonic PRIME TX-1300",
      brand: "Seasonic",
      wattage: 1300,
      efficiencyRating: "80+ Titanium",
      atxStandard: "ATX 3.0",
      modularity: "Fully Modular",
      pcie5Support: 1,
      priceEur: 409,
      sourceRefs: "https://seasonic.com/prime-tx",
    },
  ];

  const caseSeed = [
    {
      name: "Corsair 5000D AIRFLOW",
      brand: "Corsair",
      formFactor: "ATX Mid Tower",
      maxGpuMm: 420,
      radiatorSupport: "Up to 360mm front/top",
      includedFans: "2x 120mm",
      priceEur: 169,
      sourceRefs: "https://www.corsair.com/us/en/p/pc-cases/cc-9011210-ww/5000d-airflow-mid-tower-atx-pc-case-black-cc-9011210-ww",
    },
    {
      name: "NZXT H7 Flow",
      brand: "NZXT",
      formFactor: "ATX Mid Tower",
      maxGpuMm: 400,
      radiatorSupport: "Up to 420mm front, 360mm top",
      includedFans: "3x 120mm",
      priceEur: 139,
      sourceRefs: "https://nzxt.com/product/h7-flow",
    },
    {
      name: "Lian Li LANCOOL 216",
      brand: "Lian Li",
      formFactor: "ATX Mid Tower",
      maxGpuMm: 392,
      radiatorSupport: "Up to 360mm top/front",
      includedFans: "2x 160mm + 1x 140mm",
      priceEur: 109,
      sourceRefs: "https://lian-li.com/product/lancool-216",
    },
    {
      name: "Fractal Design North XL",
      brand: "Fractal",
      formFactor: "ATX Full Tower",
      maxGpuMm: 413,
      radiatorSupport: "Up to 420mm front, 360mm top",
      includedFans: "3x 140mm",
      priceEur: 189,
      sourceRefs: "https://www.fractal-design.com/products/cases/north/north-xl/",
    },
    {
      name: "Phanteks NV5",
      brand: "Phanteks",
      formFactor: "ATX Mid Tower",
      maxGpuMm: 440,
      radiatorSupport: "Up to 360mm side/top",
      includedFans: "0",
      priceEur: 119,
      sourceRefs: "https://www.phanteks.com/NV5.html",
    },
    {
      name: "Fractal Design Meshify 2",
      brand: "Fractal",
      formFactor: "ATX Mid/Full Tower",
      maxGpuMm: 467,
      radiatorSupport: "Up to 360mm front/top",
      includedFans: "3x 140mm",
      priceEur: 169,
      sourceRefs: "https://www.fractal-design.com/products/cases/meshify/meshify-2/",
    },
  ];

  const motherboardSeed = [
    {
      name: "ASUS ProArt X670E-CREATOR WIFI",
      brand: "ASUS",
      socket: "AM5",
      chipset: "X670E",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 449,
      sourceRefs: "https://www.asus.com/motherboards-components/motherboards/proart/proart-x670e-creator-wifi/",
    },
    {
      name: "MSI MAG X670E TOMAHAWK WIFI",
      brand: "MSI",
      socket: "AM5",
      chipset: "X670E",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 319,
      sourceRefs: "https://www.msi.com/Motherboard/MAG-X670E-TOMAHAWK-WIFI",
    },
    {
      name: "GIGABYTE Z790 AORUS ELITE X WIFI7",
      brand: "Gigabyte",
      socket: "LGA1700",
      chipset: "Z790",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 329,
      sourceRefs: "https://www.gigabyte.com/Motherboard/Z790-AORUS-ELITE-X-WIFI7",
    },
    {
      name: "ASUS ROG STRIX Z890-E GAMING WIFI",
      brand: "ASUS",
      socket: "LGA1851",
      chipset: "Z890",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 519,
      sourceRefs: "https://www.asus.com/motherboards-components/motherboards/all-series/filter?Category=Intel",
    },
    {
      name: "ASUS TUF GAMING B650-PLUS WIFI",
      brand: "ASUS",
      socket: "AM5",
      chipset: "B650",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 229,
      sourceRefs: "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/",
    },
    {
      name: "MSI MAG B650M MORTAR WIFI",
      brand: "MSI",
      socket: "AM5",
      chipset: "B650",
      memorySupport: "DDR5",
      maxMemoryGb: 192,
      pcieGen5Support: 1,
      priceEur: 229,
      sourceRefs: "https://www.msi.com/Motherboard/MAG-B650M-MORTAR-WIFI",
    },
    {
      name: "ASRock X870E Taichi",
      brand: "ASRock",
      socket: "AM5",
      chipset: "X870E",
      memorySupport: "DDR5",
      maxMemoryGb: 256,
      pcieGen5Support: 1,
      priceEur: 499,
      sourceRefs: "https://www.asrock.com/mb/AMD/X870E%20Taichi/index.asp",
    },
    {
      name: "Gigabyte Z890 AORUS ELITE WIFI7",
      brand: "Gigabyte",
      socket: "LGA1851",
      chipset: "Z890",
      memorySupport: "DDR5",
      maxMemoryGb: 256,
      pcieGen5Support: 1,
      priceEur: 389,
      sourceRefs: "https://www.gigabyte.com/Motherboard",
    },
  ];

  const compactSystemSeed = [
    {
      name: "Mac mini M4 AI Starter",
      vendor: "Apple",
      chip: "Apple M4",
      memoryGb: 16,
      storageGb: 512,
      gpuClass: "Integrated Apple GPU",
      installedSoftware: "Homebrew, Python 3.12, Ollama, LM Studio, VS Code, Docker Desktop",
      bestFor: "Entry local inference, coding, and API prototyping",
      priceEur: 899,
      inStock: 1,
      sourceRefs:
        "https://www.apple.com/mac-mini/ | https://ollama.com/ | https://lmstudio.ai/ | https://www.docker.com/products/docker-desktop/",
    },
    {
      name: "Mac mini M4 Pro Creator",
      vendor: "Apple",
      chip: "Apple M4 Pro",
      memoryGb: 48,
      storageGb: 1000,
      gpuClass: "Integrated Apple GPU (Pro tier)",
      installedSoftware: "Homebrew, Python 3.12, Ollama, llama.cpp, VS Code, Docker Desktop, GitHub CLI",
      bestFor: "Heavier local model workflows and multi-container dev stacks",
      priceEur: 1999,
      inStock: 1,
      sourceRefs:
        "https://www.apple.com/mac-mini/ | https://github.com/ggml-org/llama.cpp | https://code.visualstudio.com/",
    },
    {
      name: "Mac mini M2 Value Dev",
      vendor: "Apple",
      chip: "Apple M2",
      memoryGb: 24,
      storageGb: 512,
      gpuClass: "Integrated Apple GPU",
      installedSoftware: "Homebrew, Python 3.11, Ollama, VS Code, Postman",
      bestFor: "Budget macOS AI dev environment and small model testing",
      priceEur: 799,
      inStock: 1,
      sourceRefs: "https://www.apple.com/shop/buy-mac/mac-mini | https://www.postman.com/downloads/",
    },
  ];

  const storageDriveSeed = [
    {
      name: "Samsung 990 PRO 2TB",
      brand: "Samsung",
      driveType: "NVMe SSD",
      interface: "PCIe 4.0 x4",
      capacityGb: 2000,
      seqReadMbS: 7450,
      enduranceTbw: 1200,
      priceEur: 179,
      sourceRefs: "https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/",
    },
    {
      name: "WD Black SN850X 2TB",
      brand: "Western Digital",
      driveType: "NVMe SSD",
      interface: "PCIe 4.0 x4",
      capacityGb: 2000,
      seqReadMbS: 7300,
      enduranceTbw: 1200,
      priceEur: 169,
      sourceRefs: "https://www.westerndigital.com/products/internal-drives/wd-black-sn850x-nvme-ssd",
    },
    {
      name: "Crucial T705 2TB",
      brand: "Crucial",
      driveType: "NVMe SSD",
      interface: "PCIe 5.0 x4",
      capacityGb: 2000,
      seqReadMbS: 14500,
      enduranceTbw: 1200,
      priceEur: 299,
      sourceRefs: "https://www.crucial.com/ssd/t705/ct2000t705ssd3",
    },
    {
      name: "Solidigm P44 Pro 2TB",
      brand: "Solidigm",
      driveType: "NVMe SSD",
      interface: "PCIe 4.0 x4",
      capacityGb: 2000,
      seqReadMbS: 7000,
      enduranceTbw: 1200,
      priceEur: 149,
      sourceRefs: "https://www.solidigm.com/products/client/d6/p44-pro.html",
    },
    {
      name: "Seagate IronWolf Pro 8TB",
      brand: "Seagate",
      driveType: "HDD",
      interface: "SATA 6Gb/s",
      capacityGb: 8000,
      seqReadMbS: 285,
      enduranceTbw: 0,
      priceEur: 229,
      sourceRefs: "https://www.seagate.com/products/nas-drives/ironwolf-hard-drive/",
    },
  ];

  const cpuCoolerSeed = [
    {
      name: "Noctua NH-D15 G2",
      brand: "Noctua",
      coolerType: "Air",
      radiatorOrHeightMm: 168,
      socketSupport: "AM5, LGA1700, LGA1851",
      maxTdpW: 280,
      noiseDb: "19-24 dBA",
      priceEur: 149,
      sourceRefs: "https://noctua.at/en/nh-d15-g2",
    },
    {
      name: "DeepCool AK620",
      brand: "DeepCool",
      coolerType: "Air",
      radiatorOrHeightMm: 160,
      socketSupport: "AM5, LGA1700",
      maxTdpW: 260,
      noiseDb: "28 dBA max",
      priceEur: 69,
      sourceRefs: "https://www.deepcool.com/products/Cooling/cpuaircoolers/AK620-Dual-Tower-CPU-Cooler-1700-AM5/2021/13067.shtml",
    },
    {
      name: "Arctic Liquid Freezer III 360",
      brand: "Arctic",
      coolerType: "AIO",
      radiatorOrHeightMm: 360,
      socketSupport: "AM5, LGA1700",
      maxTdpW: 320,
      noiseDb: "22.5 dBA typical",
      priceEur: 119,
      sourceRefs: "https://www.arctic.de/en/Liquid-Freezer-III-360/",
    },
    {
      name: "Corsair iCUE LINK H150i RGB",
      brand: "Corsair",
      coolerType: "AIO",
      radiatorOrHeightMm: 360,
      socketSupport: "AM5, LGA1700, LGA1851",
      maxTdpW: 300,
      noiseDb: "20-37 dBA",
      priceEur: 249,
      sourceRefs: "https://www.corsair.com/us/en/p/cpu-coolers/cw-9061003-ww/icue-link-h150i-rgb-aio-liquid-cpu-cooler-cw-9061003-ww",
    },
    {
      name: "Thermalright Phantom Spirit 120 SE",
      brand: "Thermalright",
      coolerType: "Air",
      radiatorOrHeightMm: 157,
      socketSupport: "AM5, LGA1700",
      maxTdpW: 240,
      noiseDb: "25 dBA max",
      priceEur: 45,
      sourceRefs: "https://www.thermalright.com/product/phantom-spirit-120-se/",
    },
  ];

  gpuSeed.forEach((gpu) => {
    ensureGpu(db, gpu);
  });

  cpuSeed.forEach((cpu) => {
    ensureCpu(db, cpu);
  });

  ramKitSeed.forEach((ramKit) => {
    ensureRamKit(db, ramKit);
  });

  powerSupplySeed.forEach((psu) => {
    ensurePowerSupply(db, psu);
  });

  caseSeed.forEach((pcCase) => {
    ensureCase(db, pcCase);
  });

  motherboardSeed.forEach((motherboard) => {
    ensureMotherboard(db, motherboard);
  });

  compactSystemSeed.forEach((compactSystem) => {
    ensureCompactAiSystem(db, compactSystem);
  });

  storageDriveSeed.forEach((drive) => {
    ensureStorageDrive(db, drive);
  });

  cpuCoolerSeed.forEach((cooler) => {
    ensureCpuCooler(db, cooler);
  });

}

function seedProfileBuilds(db: DatabaseSync): void {
  const ids = {
    cpu7950x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7950X' LIMIT 1").get() as { id: number }).id,
    cpu9950x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 9950X' LIMIT 1").get() as { id: number }).id,
    cpu9900x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 9900X' LIMIT 1").get() as { id: number }).id,
    cpu7900: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900' LIMIT 1").get() as { id: number }).id,
    cpu7900x: (db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900X' LIMIT 1").get() as { id: number }).id,
    cpui9: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i9-14900K' LIMIT 1").get() as { id: number }).id,
    cpui7: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i7-14700K' LIMIT 1").get() as { id: number }).id,
    cpuultra9: (db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core Ultra 9 285K' LIMIT 1").get() as {
      id: number;
    }).id,
    gpu4090: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4090' LIMIT 1").get() as { id: number }).id,
    gpu4080s: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4080 SUPER' LIMIT 1").get() as { id: number }).id,
    gpu6000ada: (db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 6000 Ada' LIMIT 1").get() as {
      id: number;
    }).id,
    gpuw7900: (db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon PRO W7900' LIMIT 1").get() as {
      id: number;
    }).id,
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
    bestFor?: string;
    estimatedTokensPerSec?: string;
    estimatedSystemPowerW?: number;
    recommendedPsuW?: number;
    coolingProfile?: string;
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
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Pro 48GB Workstation",
      targetModel: "70B q4 sustained sessions",
      ramGb: 192,
      storageGb: 4000,
      estimatedPriceEur: 6899,
      notes: "Workstation-class VRAM and memory headroom for heavier local model runs.",
      sourceRefs: "GPU data: nvidia.com professional GPUs; CPU data: amd.com Ryzen 9 9950X specs.",
      cpuId: ids.cpu9950x,
      gpuId: ids.gpu6000ada,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Open-Stack 48GB ROCm Tower",
      targetModel: "34B-70B q4 mixed workflows",
      ramGb: 128,
      storageGb: 4000,
      estimatedPriceEur: 4299,
      notes: "Prioritizes high VRAM with AMD pro card and strong multicore throughput.",
      sourceRefs: "GPU data: amd.com Radeon PRO W7900 specs; CPU data: amd.com Ryzen 9 9900X specs.",
      cpuId: ids.cpu9900x,
      gpuId: ids.gpuw7900,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "96GB Memory Tuning Node",
      targetModel: "13B LoRA + retrieval pipelines",
      ramGb: 96,
      storageGb: 4000,
      estimatedPriceEur: 2149,
      notes: "Higher RAM and storage footprint for repeated dataset prep + tuning cycles.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 SUPER specs; CPU data: intel.com i7-14700K specs.",
      cpuId: ids.cpui7,
      gpuId: ids.gpu4070s,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Heavy Preprocess CUDA Rig",
      targetModel: "7B-13B QLoRA with larger corpora",
      ramGb: 128,
      storageGb: 4000,
      estimatedPriceEur: 2799,
      notes: "Strong CPU throughput for preprocessing with solid CUDA tuning performance.",
      sourceRefs: "GPU data: nvidia.com RTX 4080 SUPER specs; CPU data: intel.com Core Ultra 9 285K specs.",
      cpuId: ids.cpuultra9,
      gpuId: ids.gpu4080s,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "Creator 16GB Value Hybrid",
      targetModel: "13B-20B q4 + 1440p gaming",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1849,
      notes: "Balanced price/performance with modern AM5 platform and efficient thermals.",
      sourceRefs: "GPU data: amd.com RX 7900 GRE specs; CPU data: amd.com Ryzen 7 9700X specs.",
      cpuId: ids.cpu9900x,
      gpuId: ids.gpu7800xt,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "High-FPS + 34B Creator",
      targetModel: "34B q4 burst workloads + 1440p/4K gaming",
      ramGb: 96,
      storageGb: 4000,
      estimatedPriceEur: 3199,
      notes: "Premium mixed-use build tuned for high frame rates and stronger AI sessions.",
      sourceRefs: "GPU data: nvidia.com RTX 4090 specs; CPU data: intel.com Core Ultra 9 285K specs.",
      cpuId: ids.cpuultra9,
      gpuId: ids.gpu4090,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Ultra 70B CUDA Tower",
      targetModel: "70B q4 (select workloads)",
      ramGb: 128,
      storageGb: 4000,
      estimatedPriceEur: 3349,
      notes: "High-end local LLM workstation tuned for long 34B+ sessions.",
      sourceRefs: "GPU data: nvidia.com RTX 4090 specs; CPU data: ir.amd.com Ryzen 7000 launch (7950X).",
      cpuId: ids.cpu7950x,
      gpuId: ids.gpu4090,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Balanced 34B Dev Tower",
      targetModel: "34B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 2099,
      notes: "Balanced daily AI development system with strong local inference throughput.",
      sourceRefs:
        "GPU data: nvidia.com RTX 4080 SUPER specs; CPU data: ir.amd.com Ryzen 7000 non-X launch (7900).",
      cpuId: ids.cpu7900,
      gpuId: ids.gpu4080s,
    },
    {
      profileKey: "local-llm-inference",
      profileLabel: "Local LLM Inference",
      buildName: "Open-Stack 30B VRAM Tower",
      targetModel: "30B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1999,
      notes: "VRAM-heavy AMD path for open-source local inference stacks.",
      sourceRefs: "GPU data: amd.com RX 7900 XTX specs; CPU data: intel.com i9-14900K specs.",
      cpuId: ids.cpui9,
      gpuId: ids.gpu7900xtx,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "Creator + Gaming 16GB CUDA",
      targetModel: "30B q4 + creator/gaming mix",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1899,
      notes: "Creator-focused hybrid system with solid CUDA inference and high-refresh gaming.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 Ti SUPER specs; CPU data: intel.com i7-14700K specs.",
      cpuId: ids.cpui7,
      gpuId: ids.gpu4070tis,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Efficient 13B Entry Desktop",
      targetModel: "7B-13B q4",
      ramGb: 32,
      storageGb: 1000,
      estimatedPriceEur: 1329,
      notes: "Power-efficient entry desktop for local experimentation and starter tuning.",
      sourceRefs: "GPU data: nvidia.com RTX 4060 Ti 16GB specs; CPU data: intel.com i5-14600K specs.",
      cpuId: ids.cpui5,
      gpuId: ids.gpu4060ti16,
    },
    {
      profileKey: "hybrid-ai-gaming",
      profileLabel: "Hybrid AI + Gaming",
      buildName: "Raster-First 20B Hybrid",
      targetModel: "20B q4 + 1440p raster gaming",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1599,
      notes: "AMD-leaning hybrid setup balancing raster performance with local AI workloads.",
      sourceRefs: "GPU data: amd.com RX 7800 XT specs; CPU data: amd.com Ryzen 7800X3D specs.",
      cpuId: ids.cpu7800x3d,
      gpuId: ids.gpu7800xt,
    },
    {
      profileKey: "llm-finetune-starter",
      profileLabel: "LLM Fine-Tune Starter",
      buildName: "Quiet Daily AI Workstation",
      targetModel: "20B q4",
      ramGb: 64,
      storageGb: 2000,
      estimatedPriceEur: 1749,
      notes: "Reliable day-to-day AI coding machine tuned for quiet thermals and stable tuning runs.",
      sourceRefs: "GPU data: nvidia.com RTX 4070 SUPER specs; CPU data: ir.amd.com Ryzen 7900 launch.",
      cpuId: ids.cpu7900,
      gpuId: ids.gpu4070s,
    },
  ];

  function deriveBuildDetails(build: (typeof buildRows)[number]) {
    if (build.estimatedPriceEur >= 2800) {
      return {
        bestFor: build.bestFor ?? "Large local model sessions and workstation-grade multitasking",
        estimatedTokensPerSec: build.estimatedTokensPerSec ?? "13B q4: 55-85 tok/s | 34B q4: 18-30 tok/s",
        estimatedSystemPowerW: build.estimatedSystemPowerW ?? 760,
        recommendedPsuW: build.recommendedPsuW ?? 1000,
        coolingProfile: build.coolingProfile ?? "Premium 360mm AIO + high airflow case",
      };
    }

    if (build.estimatedPriceEur >= 2000) {
      return {
        bestFor: build.bestFor ?? "Daily AI development and strong local inference throughput",
        estimatedTokensPerSec: build.estimatedTokensPerSec ?? "13B q4: 40-65 tok/s | 34B q4: 12-22 tok/s",
        estimatedSystemPowerW: build.estimatedSystemPowerW ?? 620,
        recommendedPsuW: build.recommendedPsuW ?? 850,
        coolingProfile: build.coolingProfile ?? "Dual-tower air or 280mm AIO",
      };
    }

    if (build.estimatedPriceEur >= 1600) {
      return {
        bestFor: build.bestFor ?? "Midrange local inference and mixed creator workloads",
        estimatedTokensPerSec: build.estimatedTokensPerSec ?? "13B q4: 28-48 tok/s | 34B q4: 8-15 tok/s",
        estimatedSystemPowerW: build.estimatedSystemPowerW ?? 520,
        recommendedPsuW: build.recommendedPsuW ?? 750,
        coolingProfile: build.coolingProfile ?? "Balanced airflow with quality air cooler",
      };
    }

    return {
      bestFor: build.bestFor ?? "Entry local AI experimentation and fast iteration",
      estimatedTokensPerSec: build.estimatedTokensPerSec ?? "7B q4: 40-70 tok/s | 13B q4: 20-35 tok/s",
      estimatedSystemPowerW: build.estimatedSystemPowerW ?? 420,
      recommendedPsuW: build.recommendedPsuW ?? 650,
      coolingProfile: build.coolingProfile ?? "Standard tower air cooling",
    };
  }

  const hasLegacyUsd = hasColumn(db, "profile_builds", "estimated_price_usd");
  const insertStatement = hasLegacyUsd
    ? db.prepare(
        "INSERT INTO profile_builds (profile_key, profile_label, build_name, target_model, ram_gb, storage_gb, estimated_price_eur, estimated_price_usd, best_for, estimated_tokens_per_sec, estimated_system_power_w, recommended_psu_w, cooling_profile, notes, source_refs, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_key, build_name) DO UPDATE SET profile_label=excluded.profile_label, target_model=excluded.target_model, ram_gb=excluded.ram_gb, storage_gb=excluded.storage_gb, estimated_price_eur=excluded.estimated_price_eur, estimated_price_usd=excluded.estimated_price_usd, best_for=excluded.best_for, estimated_tokens_per_sec=excluded.estimated_tokens_per_sec, estimated_system_power_w=excluded.estimated_system_power_w, recommended_psu_w=excluded.recommended_psu_w, cooling_profile=excluded.cooling_profile, notes=excluded.notes, source_refs=excluded.source_refs, cpu_id=excluded.cpu_id, gpu_id=excluded.gpu_id",
      )
    : db.prepare(
        "INSERT INTO profile_builds (profile_key, profile_label, build_name, target_model, ram_gb, storage_gb, estimated_price_eur, best_for, estimated_tokens_per_sec, estimated_system_power_w, recommended_psu_w, cooling_profile, notes, source_refs, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_key, build_name) DO UPDATE SET profile_label=excluded.profile_label, target_model=excluded.target_model, ram_gb=excluded.ram_gb, storage_gb=excluded.storage_gb, estimated_price_eur=excluded.estimated_price_eur, best_for=excluded.best_for, estimated_tokens_per_sec=excluded.estimated_tokens_per_sec, estimated_system_power_w=excluded.estimated_system_power_w, recommended_psu_w=excluded.recommended_psu_w, cooling_profile=excluded.cooling_profile, notes=excluded.notes, source_refs=excluded.source_refs, cpu_id=excluded.cpu_id, gpu_id=excluded.gpu_id",
      );

  buildRows.forEach((build) => {
    const details = deriveBuildDetails(build);
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
        details.bestFor,
        details.estimatedTokensPerSec,
        details.estimatedSystemPowerW,
        details.recommendedPsuW,
        details.coolingProfile,
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
        details.bestFor,
        details.estimatedTokensPerSec,
        details.estimatedSystemPowerW,
        details.recommendedPsuW,
        details.coolingProfile,
        build.notes,
        build.sourceRefs,
        build.cpuId,
        build.gpuId,
      );
    }
  });
}

function initDatabase(): DatabaseSync {
  const dataDir = resolveDataDir();
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

    CREATE TABLE IF NOT EXISTS ram_kits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      capacity_gb INTEGER NOT NULL,
      modules TEXT NOT NULL,
      ddr_gen TEXT NOT NULL,
      speed_mt_s INTEGER NOT NULL,
      cas_latency TEXT NOT NULL,
      profile_support TEXT NOT NULL,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS power_supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      wattage INTEGER NOT NULL,
      efficiency_rating TEXT NOT NULL,
      atx_standard TEXT NOT NULL,
      modularity TEXT NOT NULL,
      pcie_5_support INTEGER NOT NULL DEFAULT 0,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pc_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      form_factor TEXT NOT NULL,
      max_gpu_mm INTEGER NOT NULL,
      radiator_support TEXT NOT NULL,
      included_fans TEXT NOT NULL,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS motherboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      socket TEXT NOT NULL,
      chipset TEXT NOT NULL,
      memory_support TEXT NOT NULL,
      max_memory_gb INTEGER NOT NULL,
      pcie_gen5_support INTEGER NOT NULL DEFAULT 0,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS compact_ai_systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      vendor TEXT NOT NULL,
      chip TEXT NOT NULL,
      memory_gb INTEGER NOT NULL,
      storage_gb INTEGER NOT NULL,
      gpu_class TEXT NOT NULL,
      installed_software TEXT NOT NULL,
      best_for TEXT NOT NULL,
      price_eur INTEGER NOT NULL,
      in_stock INTEGER NOT NULL DEFAULT 1,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS storage_drives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      drive_type TEXT NOT NULL,
      interface TEXT NOT NULL,
      capacity_gb INTEGER NOT NULL,
      seq_read_mb_s INTEGER NOT NULL,
      endurance_tbw INTEGER NOT NULL,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cpu_coolers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      cooler_type TEXT NOT NULL,
      radiator_or_height_mm INTEGER NOT NULL,
      socket_support TEXT NOT NULL,
      max_tdp_w INTEGER NOT NULL,
      noise_db TEXT NOT NULL,
      price_eur INTEGER NOT NULL,
      source_refs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estonian_price_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      base_price_eur INTEGER NOT NULL,
      market_avg_eur REAL NOT NULL,
      assembly_markup_pct REAL NOT NULL DEFAULT 15.0,
      final_price_eur REAL NOT NULL,
      sample_count INTEGER NOT NULL,
      sources TEXT NOT NULL,
      checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, item_id)
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
      best_for TEXT NOT NULL DEFAULT 'General AI workloads',
      estimated_tokens_per_sec TEXT NOT NULL DEFAULT 'n/a',
      estimated_system_power_w INTEGER NOT NULL DEFAULT 450,
      recommended_psu_w INTEGER NOT NULL DEFAULT 750,
      cooling_profile TEXT NOT NULL DEFAULT 'Balanced air cooling',
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

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      profile_build_id INTEGER NOT NULL,
      build_name TEXT NOT NULL,
      amount_eur_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'eur',
      status TEXT NOT NULL CHECK(status IN ('PENDING', 'CHECKOUT_CREATED', 'PAID', 'CANCELED', 'FAILED')) DEFAULT 'PENDING',
      stripe_checkout_session_id TEXT UNIQUE,
      stripe_payment_intent_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (profile_build_id) REFERENCES profile_builds(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_profile_build_id ON orders(profile_build_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensureEuroPriceColumns(db);
  ensureProfileBuildDetailColumns(db);
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

export function listRamKits(): RamKitRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, capacity_gb, modules, ddr_gen, speed_mt_s, cas_latency, profile_support, price_eur, source_refs FROM ram_kits ORDER BY capacity_gb DESC, speed_mt_s DESC",
    )
    .all() as RamKitRecord[];
}

export function listPowerSupplies(): PowerSupplyRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, wattage, efficiency_rating, atx_standard, modularity, pcie_5_support, price_eur, source_refs FROM power_supplies ORDER BY wattage DESC",
    )
    .all() as PowerSupplyRecord[];
}

export function listCases(): CaseRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, form_factor, max_gpu_mm, radiator_support, included_fans, price_eur, source_refs FROM pc_cases ORDER BY price_eur DESC",
    )
    .all() as CaseRecord[];
}

export function listMotherboards(): MotherboardRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, socket, chipset, memory_support, max_memory_gb, pcie_gen5_support, price_eur, source_refs FROM motherboards ORDER BY price_eur DESC",
    )
    .all() as MotherboardRecord[];
}

export function listCompactAiSystems(): CompactAiSystemRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, vendor, chip, memory_gb, storage_gb, gpu_class, installed_software, best_for, price_eur, in_stock, source_refs FROM compact_ai_systems ORDER BY price_eur DESC",
    )
    .all() as CompactAiSystemRecord[];
}

export function listStorageDrives(): StorageDriveRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, drive_type, interface, capacity_gb, seq_read_mb_s, endurance_tbw, price_eur, source_refs FROM storage_drives ORDER BY drive_type ASC, seq_read_mb_s DESC",
    )
    .all() as StorageDriveRecord[];
}

export function listCpuCoolers(): CpuCoolerRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, name, brand, cooler_type, radiator_or_height_mm, socket_support, max_tdp_w, noise_db, price_eur, source_refs FROM cpu_coolers ORDER BY max_tdp_w DESC",
    )
    .all() as CpuCoolerRecord[];
}

export function listEstonianPriceChecks(): EstonianPriceCheckRecord[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, category, item_id, item_name, base_price_eur, market_avg_eur, assembly_markup_pct, final_price_eur, sample_count, sources, checked_at FROM estonian_price_checks",
    )
    .all() as EstonianPriceCheckRecord[];
}

export function upsertEstonianPriceCheck(input: {
  category: string;
  itemId: number;
  itemName: string;
  basePriceEur: number;
  marketAvgEur: number;
  assemblyMarkupPct: number;
  finalPriceEur: number;
  sampleCount: number;
  sources: string;
}): void {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO estonian_price_checks
      (category, item_id, item_name, base_price_eur, market_avg_eur, assembly_markup_pct, final_price_eur, sample_count, sources, checked_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(category, item_id) DO UPDATE SET
      item_name = excluded.item_name,
      base_price_eur = excluded.base_price_eur,
      market_avg_eur = excluded.market_avg_eur,
      assembly_markup_pct = excluded.assembly_markup_pct,
      final_price_eur = excluded.final_price_eur,
      sample_count = excluded.sample_count,
      sources = excluded.sources,
      checked_at = CURRENT_TIMESTAMP
  `,
  ).run(
    input.category,
    input.itemId,
    input.itemName,
    input.basePriceEur,
    input.marketAvgEur,
    input.assemblyMarkupPct,
    input.finalPriceEur,
    input.sampleCount,
    input.sources,
  );
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
        pb.best_for,
        pb.estimated_tokens_per_sec,
        pb.estimated_system_power_w,
        pb.recommended_psu_w,
        pb.cooling_profile,
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

export function getProfileBuildById(id: number): ProfileBuildRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        pb.id,
        pb.profile_key,
        pb.profile_label,
        pb.build_name,
        pb.target_model,
        pb.ram_gb,
        pb.storage_gb,
        pb.estimated_price_eur,
        pb.best_for,
        pb.estimated_tokens_per_sec,
        pb.estimated_system_power_w,
        pb.recommended_psu_w,
        pb.cooling_profile,
        pb.notes,
        pb.source_refs,
        c.name AS cpu_name,
        g.name AS gpu_name
      FROM profile_builds pb
      JOIN cpus c ON c.id = pb.cpu_id
      JOIN gpus g ON g.id = pb.gpu_id
      WHERE pb.id = ?
      LIMIT 1
    `,
    )
    .get(id);

  return (row as ProfileBuildRecord | undefined) ?? null;
}

export async function registerAccount(input: {
  email: string;
  password: string;
  adminSetupCode?: string;
}): Promise<{ ok: true; user: PublicUser } | { ok: false; message: string }> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!email.includes("@")) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (password.length < 12) {
    return { ok: false, message: "Password must be at least 12 characters." };
  }

  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const existing = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
    if (existing.rowCount) {
      return { ok: false, message: "An account with this email already exists." };
    }

    let role: UserRole = "USER";
    if (email === ADMIN_EMAIL) {
      const anyAdmin = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
      if (anyAdmin.rowCount) {
        return { ok: false, message: "Admin account already exists." };
      }

      const adminSetupKey = process.env.ADMIN_SETUP_CODE;
      if (!adminSetupKey || input.adminSetupCode !== adminSetupKey) {
        return { ok: false, message: "Admin setup code is required for the admin account." };
      }

      role = "ADMIN";
    }

    const passwordHash = hashPassword(password);
    const inserted = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at",
      [email, passwordHash, role],
    );
    const row = inserted.rows[0] as { id: number; email: string; role: UserRole; created_at: string | Date } | undefined;
    if (!row) {
      return { ok: false, message: "Failed to create account." };
    }

    return {
      ok: true,
      user: {
        id: row.id,
        email: row.email,
        role: row.role,
        createdAt: rowDateToString(row.created_at),
      },
    };
  }

  const db = getDb();
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

export async function createSessionForCredentials(input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ ok: true; token: string; user: PublicUser; expiresAt: string } | { ok: false; message: string }> {
  const normalizedEmail = normalizeEmail(input.email);

  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const userQuery = await pool.query(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail],
    );
    const user = userQuery.rows[0] as DbUserRecord | undefined;

    if (!user) {
      return { ok: false, message: "No account found for this email. Please sign up first." };
    }

    if (!verifyPassword(input.password, user.password_hash)) {
      return { ok: false, message: "Incorrect password." };
    }

    const token = createSessionToken();
    const tokenHash = hashToken(token);
    const expiry = expiresAt(SESSION_DAYS);
    await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3::timestamptz, $4, $5)",
      [user.id, tokenHash, expiry, input.ipAddress ?? null, input.userAgent ?? null],
    );

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: rowDateToString((user as unknown as { created_at: string | Date }).created_at),
      },
      expiresAt: expiry,
    };
  }

  const db = getDb();
  const user = getUserByEmail(normalizedEmail);

  if (!user) {
    return { ok: false, message: "No account found for this email. Please sign up first." };
  }

  if (!verifyPassword(input.password, user.password_hash)) {
    return { ok: false, message: "Incorrect password." };
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

export async function getUserFromSessionToken(token: string | undefined): Promise<PublicUser | null> {
  if (!token) {
    return null;
  }

  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const tokenHash = hashToken(token);
    const result = await pool.query(
      `
      SELECT u.id, u.email, u.password_hash, u.role, u.created_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.invalidated_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash],
    );
    const row = result.rows[0] as DbUserRecord | undefined;
    return row
      ? {
          id: row.id,
          email: row.email,
          role: row.role,
          createdAt: rowDateToString((row as unknown as { created_at: string | Date }).created_at),
        }
      : null;
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

export async function invalidateSessionToken(token: string | undefined): Promise<void> {
  if (!token) {
    return;
  }

  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const tokenHash = hashToken(token);
    await pool.query("UPDATE sessions SET invalidated_at = NOW() WHERE token_hash = $1", [tokenHash]);
    return;
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  db.prepare("UPDATE sessions SET invalidated_at = datetime('now') WHERE token_hash = ?").run(tokenHash);
}

export async function getAccountSummary(): Promise<AccountSummary> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END)::int AS admins,
        SUM(CASE WHEN role = 'DEV' THEN 1 ELSE 0 END)::int AS devs,
        SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END)::int AS users
      FROM users
    `);
    const row = result.rows[0] as { total: number; admins: number; devs: number; users: number };
    return {
      total: row?.total ?? 0,
      admins: row?.admins ?? 0,
      devs: row?.devs ?? 0,
      users: row?.users ?? 0,
    };
  }

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

export async function createPendingOrderForBuild(input: {
  userId: number;
  buildId: number;
}): Promise<{ ok: true; orderId: number; buildName: string; amountEurCents: number } | { ok: false; message: string }> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const build = getProfileBuildById(input.buildId);
    if (!build) {
      return { ok: false, message: "Build not found." };
    }

    const amountEurCents = Math.max(0, Math.trunc(build.estimated_price_eur * 100));
    if (amountEurCents <= 0) {
      return { ok: false, message: "Build price is invalid." };
    }

    const inserted = await pool.query(
      "INSERT INTO orders (user_id, profile_build_id, build_name, amount_eur_cents, currency, status) VALUES ($1, $2, $3, $4, 'eur', 'PENDING') RETURNING id",
      [input.userId, input.buildId, build.build_name, amountEurCents],
    );
    const orderId = Number(inserted.rows[0]?.id);
    if (!Number.isFinite(orderId)) {
      return { ok: false, message: "Could not create order." };
    }

    return {
      ok: true,
      orderId,
      buildName: build.build_name,
      amountEurCents,
    };
  }

  const db = getDb();
  const build = db
    .prepare("SELECT id, build_name, estimated_price_eur FROM profile_builds WHERE id = ? LIMIT 1")
    .get(input.buildId) as { id: number; build_name: string; estimated_price_eur: number } | undefined;

  if (!build) {
    return { ok: false, message: "Build not found." };
  }

  const amountEurCents = Math.max(0, Math.trunc(build.estimated_price_eur * 100));
  if (amountEurCents <= 0) {
    return { ok: false, message: "Build price is invalid." };
  }
  const inserted = db
    .prepare(
      "INSERT INTO orders (user_id, profile_build_id, build_name, amount_eur_cents, currency, status) VALUES (?, ?, ?, ?, 'eur', 'PENDING')",
    )
    .run(input.userId, build.id, build.build_name, amountEurCents) as { lastInsertRowid: number | bigint };

  const orderId = Number(inserted.lastInsertRowid);
  return {
    ok: true,
    orderId,
    buildName: build.build_name,
    amountEurCents,
  };
}

export async function setOrderCheckoutSession(input: { orderId: number; checkoutSessionId: string }): Promise<void> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE orders
      SET status = 'CHECKOUT_CREATED',
          stripe_checkout_session_id = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [input.checkoutSessionId, input.orderId],
    );
    return;
  }

  const db = getDb();
  db.prepare(
    `
      UPDATE orders
      SET status = 'CHECKOUT_CREATED',
          stripe_checkout_session_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(input.checkoutSessionId, input.orderId);
}

export async function markOrderPaidFromCheckoutSession(input: {
  checkoutSessionId: string;
  paymentIntentId: string | null;
}): Promise<void> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE orders
      SET status = 'PAID',
          stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
          updated_at = NOW()
      WHERE stripe_checkout_session_id = $2
      `,
      [input.paymentIntentId, input.checkoutSessionId],
    );
    return;
  }

  const db = getDb();
  db.prepare(
    `
      UPDATE orders
      SET status = 'PAID',
          stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE stripe_checkout_session_id = ?
    `,
  ).run(input.paymentIntentId, input.checkoutSessionId);
}

export async function markOrderFailedFromCheckoutSession(input: {
  checkoutSessionId: string;
  paymentIntentId: string | null;
}): Promise<void> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE orders
      SET status = 'FAILED',
          stripe_payment_intent_id = COALESCE($1, stripe_payment_intent_id),
          updated_at = NOW()
      WHERE stripe_checkout_session_id = $2
      `,
      [input.paymentIntentId, input.checkoutSessionId],
    );
    return;
  }

  const db = getDb();
  db.prepare(
    `
      UPDATE orders
      SET status = 'FAILED',
          stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE stripe_checkout_session_id = ?
    `,
  ).run(input.paymentIntentId, input.checkoutSessionId);
}

export async function markOrderCanceledFromCheckoutSession(checkoutSessionId: string): Promise<void> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE orders
      SET status = 'CANCELED',
          updated_at = NOW()
      WHERE stripe_checkout_session_id = $1
      `,
      [checkoutSessionId],
    );
    return;
  }

  const db = getDb();
  db.prepare(
    `
      UPDATE orders
      SET status = 'CANCELED',
          updated_at = CURRENT_TIMESTAMP
      WHERE stripe_checkout_session_id = ?
    `,
  ).run(checkoutSessionId);
}

export async function getOrderByCheckoutSessionForUser(input: {
  userId: number;
  checkoutSessionId: string;
}): Promise<OrderRecord | null> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        profile_build_id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = $1 AND stripe_checkout_session_id = $2
      LIMIT 1
      `,
      [input.userId, input.checkoutSessionId],
    );
    const row = result.rows[0] as (OrderRow & { created_at: string | Date; updated_at: string | Date }) | undefined;
    if (!row) {
      return null;
    }
    return {
      ...row,
      created_at: rowDateToString(row.created_at),
      updated_at: rowDateToString(row.updated_at),
    };
  }

  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        id,
        user_id,
        profile_build_id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ? AND stripe_checkout_session_id = ?
      LIMIT 1
    `,
    )
    .get(input.userId, input.checkoutSessionId);

  return (row as OrderRow | undefined) ?? null;
}

export async function getOrderById(id: number): Promise<OrderRecord | null> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        profile_build_id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        created_at,
        updated_at
      FROM orders
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );
    const row = result.rows[0] as (OrderRow & { created_at: string | Date; updated_at: string | Date }) | undefined;
    if (!row) {
      return null;
    }
    return {
      ...row,
      created_at: rowDateToString(row.created_at),
      updated_at: rowDateToString(row.updated_at),
    };
  }

  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        id,
        user_id,
        profile_build_id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    )
    .get(id);

  return (row as OrderRow | undefined) ?? null;
}

export async function getRecentOpenOrderForBuild(input: {
  userId: number;
  buildId: number;
}): Promise<(Pick<OrderRecord, "id" | "build_name" | "amount_eur_cents" | "stripe_checkout_session_id"> & {
  status: OrderStatus;
}) | null> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT id, build_name, amount_eur_cents, stripe_checkout_session_id, status
      FROM orders
      WHERE user_id = $1
        AND profile_build_id = $2
        AND status IN ('PENDING', 'CHECKOUT_CREATED')
        AND created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY id DESC
      LIMIT 1
      `,
      [input.userId, input.buildId],
    );
    const row = result.rows[0] as
      | (Pick<OrderRecord, "id" | "build_name" | "amount_eur_cents" | "stripe_checkout_session_id"> & {
          status: OrderStatus;
        })
      | undefined;
    return row ?? null;
  }

  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, build_name, amount_eur_cents, stripe_checkout_session_id, status
      FROM orders
      WHERE user_id = ?
        AND profile_build_id = ?
        AND status IN ('PENDING', 'CHECKOUT_CREATED')
        AND datetime(created_at) > datetime('now', '-30 minutes')
      ORDER BY id DESC
      LIMIT 1
    `,
    )
    .get(input.userId, input.buildId);

  return (
    (row as
      | (Pick<OrderRecord, "id" | "build_name" | "amount_eur_cents" | "stripe_checkout_session_id"> & {
          status: OrderStatus;
        })
      | undefined) ?? null
  );
}

export async function recordStripeWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      "INSERT INTO stripe_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING",
      [eventId, eventType],
    );
    return (result.rowCount ?? 0) > 0;
  }

  const db = getDb();
  try {
    db.prepare("INSERT INTO stripe_webhook_events (event_id, event_type) VALUES (?, ?)").run(eventId, eventType);
    return true;
  } catch {
    return false;
  }
}

export async function markOrderCheckoutCreationFailed(orderId: number): Promise<void> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    await pool.query(
      `
      UPDATE orders
      SET status = 'FAILED',
          updated_at = NOW()
      WHERE id = $1
      `,
      [orderId],
    );
    return;
  }

  const db = getDb();
  db.prepare(
    `
      UPDATE orders
      SET status = 'FAILED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(orderId);
}

export async function listOrdersForUser(userId: number): Promise<UserOrderListItem[]> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT
        id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId],
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      build_name: String(row.build_name),
      amount_eur_cents: Number(row.amount_eur_cents),
      currency: String(row.currency),
      status: row.status as OrderStatus,
      stripe_checkout_session_id: (row.stripe_checkout_session_id as string | null) ?? null,
      created_at: rowDateToString(row.created_at),
      updated_at: rowDateToString(row.updated_at),
    }));
  }

  const db = getDb();
  return db
    .prepare(
      `
      SELECT
        id,
        build_name,
        amount_eur_cents,
        currency,
        status,
        stripe_checkout_session_id,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ?
      ORDER BY id DESC
    `,
    )
    .all(userId) as UserOrderListItem[];
}

export async function listAllOrdersForAdmin(): Promise<AdminOrderListItem[]> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.user_id,
        u.email AS user_email,
        o.profile_build_id,
        o.build_name,
        o.amount_eur_cents,
        o.currency,
        o.status,
        o.stripe_checkout_session_id,
        o.stripe_payment_intent_id,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      `,
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      user_id: Number(row.user_id),
      user_email: String(row.user_email),
      profile_build_id: Number(row.profile_build_id),
      build_name: String(row.build_name),
      amount_eur_cents: Number(row.amount_eur_cents),
      currency: String(row.currency),
      status: row.status as OrderStatus,
      stripe_checkout_session_id: (row.stripe_checkout_session_id as string | null) ?? null,
      stripe_payment_intent_id: (row.stripe_payment_intent_id as string | null) ?? null,
      created_at: rowDateToString(row.created_at),
      updated_at: rowDateToString(row.updated_at),
    }));
  }

  const db = getDb();
  return db
    .prepare(
      `
      SELECT
        o.id,
        o.user_id,
        u.email AS user_email,
        o.profile_build_id,
        o.build_name,
        o.amount_eur_cents,
        o.currency,
        o.status,
        o.stripe_checkout_session_id,
        o.stripe_payment_intent_id,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
    `,
    )
    .all() as AdminOrderListItem[];
}

export async function getPaidOrderEmailPayloadByCheckoutSession(
  checkoutSessionId: string,
): Promise<PaidOrderEmailPayload | null> {
  if (shouldUsePersistentSql()) {
    await ensurePgSchema();
    const pool = getPgPool();
    const result = await pool.query(
      `
      SELECT
        o.id AS "orderId",
        u.email AS "customerEmail",
        o.build_name AS "buildName",
        o.amount_eur_cents AS "amountEurCents",
        o.created_at AS "createdAt"
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.stripe_checkout_session_id = $1
      LIMIT 1
      `,
      [checkoutSessionId],
    );
    const row = result.rows[0] as
      | { orderId: number; customerEmail: string; buildName: string; amountEurCents: number; createdAt: string | Date }
      | undefined;
    if (!row) {
      return null;
    }
    return {
      ...row,
      createdAt: rowDateToString(row.createdAt),
    };
  }

  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        o.id AS orderId,
        u.email AS customerEmail,
        o.build_name AS buildName,
        o.amount_eur_cents AS amountEurCents,
        o.created_at AS createdAt
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.stripe_checkout_session_id = ?
      LIMIT 1
    `,
    )
    .get(checkoutSessionId);

  return (row as PaidOrderEmailPayload | undefined) ?? null;
}

export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
