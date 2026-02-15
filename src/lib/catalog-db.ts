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
  price_usd: number;
};

export type CpuRecord = {
  id: number;
  name: string;
  brand: string;
  cores: number;
  threads: number;
  socket: string;
  ai_score: number;
  price_usd: number;
};

export type PrebuiltRecord = {
  id: number;
  name: string;
  vendor: string;
  description: string;
  ram_gb: number;
  storage_gb: number;
  llm_max_model_size: string;
  price_usd: number;
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
  estimated_price_usd: number;
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

function ensureGpu(
  db: DatabaseSync,
  gpu: {
    name: string;
    brand: string;
    vramGb: number;
    architecture: string;
    tdpWatts: number;
    aiScore: number;
    priceUsd: number;
  },
): number {
  const existing = db.prepare("SELECT id FROM gpus WHERE name = ? LIMIT 1").get(gpu.name) as { id: number } | undefined;
  if (existing) {
    return existing.id;
  }

  db.prepare(
    "INSERT INTO gpus (name, brand, vram_gb, architecture, tdp_watts, ai_score, price_usd) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(gpu.name, gpu.brand, gpu.vramGb, gpu.architecture, gpu.tdpWatts, gpu.aiScore, gpu.priceUsd);

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
    priceUsd: number;
  },
): number {
  const existing = db.prepare("SELECT id FROM cpus WHERE name = ? LIMIT 1").get(cpu.name) as { id: number } | undefined;
  if (existing) {
    return existing.id;
  }

  db.prepare(
    "INSERT INTO cpus (name, brand, cores, threads, base_clock_ghz, boost_clock_ghz, socket, tdp_watts, ai_score, price_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    cpu.priceUsd,
  );

  const inserted = db.prepare("SELECT id FROM cpus WHERE name = ? LIMIT 1").get(cpu.name) as { id: number };
  return inserted.id;
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
      priceUsd: 1599,
    },
    {
      name: "NVIDIA RTX 4080 SUPER",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 320,
      aiScore: 92,
      priceUsd: 999,
    },
    {
      name: "NVIDIA RTX 4070 Ti SUPER",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 285,
      aiScore: 88,
      priceUsd: 799,
    },
    {
      name: "AMD Radeon RX 7900 XTX",
      brand: "AMD",
      vramGb: 24,
      architecture: "RDNA 3",
      tdpWatts: 355,
      aiScore: 86,
      priceUsd: 999,
    },
    {
      name: "AMD Radeon RX 7900 XT",
      brand: "AMD",
      vramGb: 20,
      architecture: "RDNA 3",
      tdpWatts: 300,
      aiScore: 82,
      priceUsd: 899,
    },
    {
      name: "NVIDIA RTX 4060 Ti 16GB",
      brand: "NVIDIA",
      vramGb: 16,
      architecture: "Ada Lovelace",
      tdpWatts: 160,
      aiScore: 73,
      priceUsd: 499,
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
      priceUsd: 699,
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
      priceUsd: 429,
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
      priceUsd: 549,
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
      priceUsd: 589,
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
      priceUsd: 409,
    },
  ];

  gpuSeed.forEach((gpu) => {
    ensureGpu(db, gpu);
  });

  cpuSeed.forEach((cpu) => {
    ensureCpu(db, cpu);
  });

  const prebuiltCount = (db.prepare("SELECT COUNT(*) AS count FROM prebuilts").get() as { count: number }).count;
  if (prebuiltCount === 0) {
    const cpu7900 = db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7900' LIMIT 1").get() as { id: number };
    const cpu7950x = db.prepare("SELECT id FROM cpus WHERE name = 'AMD Ryzen 9 7950X' LIMIT 1").get() as { id: number };
    const cpui9 = db.prepare("SELECT id FROM cpus WHERE name = 'Intel Core i9-14900K' LIMIT 1").get() as { id: number };

    const gpu4080s = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4080 SUPER' LIMIT 1").get() as { id: number };
    const gpu4090 = db.prepare("SELECT id FROM gpus WHERE name = 'NVIDIA RTX 4090' LIMIT 1").get() as { id: number };
    const gpu7900xtx = db.prepare("SELECT id FROM gpus WHERE name = 'AMD Radeon RX 7900 XTX' LIMIT 1").get() as {
      id: number;
    };

    db.prepare(
      "INSERT INTO prebuilts (name, vendor, description, price_usd, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "Nebula Forge XL",
      "fart_picker Labs",
      "High-end local LLM workstation for 34B+ quantized models.",
      3899,
      128,
      4000,
      "70B q4 (select workloads)",
      1,
      cpu7950x.id,
      gpu4090.id,
    );

    db.prepare(
      "INSERT INTO prebuilts (name, vendor, description, price_usd, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "Vector Home Pro",
      "fart_picker Labs",
      "Balanced AI dev tower for daily coding and local inference.",
      2299,
      64,
      2000,
      "34B q4",
      1,
      cpu7900.id,
      gpu4080s.id,
    );

    db.prepare(
      "INSERT INTO prebuilts (name, vendor, description, price_usd, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "Redline Studio AI",
      "fart_picker Labs",
      "VRAM-heavy AMD option for open-source inference stacks.",
      2099,
      64,
      2000,
      "30B q4",
      0,
      cpui9.id,
      gpu7900xtx.id,
    );
  }
}

function seedProfileBuilds(db: DatabaseSync): void {
  const count = (db.prepare("SELECT COUNT(*) AS count FROM profile_builds").get() as { count: number }).count;
  if (count > 0) {
    return;
  }

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
  };

  const buildRows: Array<{
    profileKey: string;
    profileLabel: string;
    buildName: string;
    targetModel: string;
    ramGb: number;
    storageGb: number;
    estimatedPriceUsd: number;
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
      estimatedPriceUsd: 3599,
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
      estimatedPriceUsd: 2299,
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
      estimatedPriceUsd: 2399,
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
      estimatedPriceUsd: 2599,
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
      estimatedPriceUsd: 1699,
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
      estimatedPriceUsd: 2499,
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
      estimatedPriceUsd: 2699,
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
      estimatedPriceUsd: 2099,
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
      estimatedPriceUsd: 2199,
      notes: "High VRAM plus solid gaming value for users open to AMD GPU tooling.",
      sourceRefs: "GPU data: amd.com RX 7900 XTX specs; CPU data: ir.amd.com Ryzen 7000 non-X launch.",
      cpuId: ids.cpu7900x,
      gpuId: ids.gpu7900xtx,
    },
  ];

  const insertStatement = db.prepare(
    "INSERT OR IGNORE INTO profile_builds (profile_key, profile_label, build_name, target_model, ram_gb, storage_gb, estimated_price_usd, notes, source_refs, cpu_id, gpu_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );

  buildRows.forEach((build) => {
    insertStatement.run(
      build.profileKey,
      build.profileLabel,
      build.buildName,
      build.targetModel,
      build.ramGb,
      build.storageGb,
      build.estimatedPriceUsd,
      build.notes,
      build.sourceRefs,
      build.cpuId,
      build.gpuId,
    );
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
      price_usd INTEGER NOT NULL
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
      price_usd INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prebuilts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      description TEXT NOT NULL,
      price_usd INTEGER NOT NULL,
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
      estimated_price_usd INTEGER NOT NULL,
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
    .prepare("SELECT id, name, brand, vram_gb, architecture, ai_score, price_usd FROM gpus ORDER BY ai_score DESC")
    .all() as GpuRecord[];
}

export function listCpus(): CpuRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT id, name, brand, cores, threads, socket, ai_score, price_usd FROM cpus ORDER BY ai_score DESC")
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
        p.price_usd,
        p.in_stock,
        c.name AS cpu_name,
        g.name AS gpu_name
      FROM prebuilts p
      JOIN cpus c ON c.id = p.cpu_id
      JOIN gpus g ON g.id = p.gpu_id
      ORDER BY p.price_usd DESC
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
        pb.estimated_price_usd,
        pb.notes,
        pb.source_refs,
        c.name AS cpu_name,
        g.name AS gpu_name
      FROM profile_builds pb
      JOIN cpus c ON c.id = pb.cpu_id
      JOIN gpus g ON g.id = pb.gpu_id
      ORDER BY pb.profile_key ASC, pb.estimated_price_usd ASC
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
