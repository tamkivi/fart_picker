import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

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

const globalForCatalogDb = globalThis as unknown as {
  catalogDb: DatabaseSync | undefined;
};

function seedIfEmpty(db: DatabaseSync): void {
  const gpuCount = (db.prepare("SELECT COUNT(*) AS count FROM gpus").get() as { count: number }).count;
  if (gpuCount > 0) {
    return;
  }

  db.exec(`
    INSERT INTO gpus (name, brand, vram_gb, architecture, tdp_watts, ai_score, price_usd) VALUES
      ('NVIDIA RTX 4090', 'NVIDIA', 24, 'Ada Lovelace', 450, 98, 1699),
      ('NVIDIA RTX 4080 SUPER', 'NVIDIA', 16, 'Ada Lovelace', 320, 89, 999),
      ('AMD Radeon RX 7900 XTX', 'AMD', 24, 'RDNA 3', 355, 80, 959);

    INSERT INTO cpus (name, brand, cores, threads, base_clock_ghz, boost_clock_ghz, socket, tdp_watts, ai_score, price_usd) VALUES
      ('AMD Ryzen 9 7950X', 'AMD', 16, 32, 4.5, 5.7, 'AM5', 170, 95, 549),
      ('AMD Ryzen 9 7900', 'AMD', 12, 24, 3.7, 5.4, 'AM5', 65, 87, 409),
      ('Intel Core i9-14900K', 'Intel', 24, 32, 3.2, 6.0, 'LGA1700', 125, 92, 589);

    INSERT INTO prebuilts (name, vendor, description, price_usd, ram_gb, storage_gb, llm_max_model_size, in_stock, cpu_id, gpu_id) VALUES
      ('Nebula Forge XL', 'fart_picker Labs', 'High-end local LLM workstation for 34B+ quantized models.', 3899, 128, 4000, '70B q4 (select workloads)', 1, 1, 1),
      ('Vector Home Pro', 'fart_picker Labs', 'Balanced AI dev tower for daily coding and local inference.', 2299, 64, 2000, '34B q4', 1, 2, 2),
      ('Redline Studio AI', 'fart_picker Labs', 'VRAM-heavy AMD option for open-source inference stacks.', 2099, 64, 2000, '30B q4', 0, 3, 3);
  `);
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
  `);

  seedIfEmpty(db);
  return db;
}

function getDb(): DatabaseSync {
  if (!globalForCatalogDb.catalogDb) {
    globalForCatalogDb.catalogDb = initDatabase();
  }
  return globalForCatalogDb.catalogDb;
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
