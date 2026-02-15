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

function seedCatalogIfEmpty(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) AS count FROM gpus").get() as { count: number };
  if (row.count > 0) {
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

  seedCatalogIfEmpty(db);
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
