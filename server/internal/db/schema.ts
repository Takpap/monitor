import type { Database } from 'bun:sqlite'

function columnExists(db: Database, tableName: 'subscriptions' | 'hits', columnName: string) {
  const rows = db.query(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>
  return rows.some((row) => row.name === columnName)
}

function ensureColumn(
  db: Database,
  tableName: 'subscriptions' | 'hits',
  columnName: string,
  definition: string
) {
  if (!columnExists(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`)
  }
}

export function initSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id TEXT NOT NULL DEFAULT 'default',
      name TEXT NOT NULL,
      keywords TEXT NOT NULL,
      exclude_keywords TEXT NOT NULL,
      match_mode TEXT NOT NULL DEFAULT 'any',
      min_comments INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seen_items (
      subscription_id INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      seen_at TEXT NOT NULL,
      PRIMARY KEY (subscription_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id TEXT NOT NULL DEFAULT 'default',
      subscription_id INTEGER NOT NULL,
      subscription_name TEXT NOT NULL,
      item_id TEXT NOT NULL,
      article_id TEXT,
      title TEXT NOT NULL,
      link TEXT NOT NULL,
      comment_count INTEGER,
      min_comments INTEGER NOT NULL,
      matched_keywords TEXT NOT NULL,
      pub_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hit_id INTEGER NOT NULL,
      owner_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monitor_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      owner_id TEXT NOT NULL,
      action TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_hits_created_at ON hits(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_seen_items_seen_at ON seen_items(seen_at);
  `)

  ensureColumn(db, 'subscriptions', 'owner_id', `owner_id TEXT NOT NULL DEFAULT 'default'`)
  ensureColumn(db, 'hits', 'owner_id', `owner_id TEXT NOT NULL DEFAULT 'default'`)
  ensureColumn(db, 'hits', 'image_url', `image_url TEXT`)

  db.exec(`
    UPDATE subscriptions SET owner_id = 'default' WHERE owner_id IS NULL OR TRIM(owner_id) = '';
    UPDATE hits SET owner_id = 'default' WHERE owner_id IS NULL OR TRIM(owner_id) = '';
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_id ON subscriptions(owner_id);
    CREATE INDEX IF NOT EXISTS idx_hits_owner_id_created_at ON hits(owner_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_deliveries_owner_created_at ON deliveries(owner_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_subscription_versions_subscription_created_at ON subscription_versions(subscription_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_subscription_versions_owner_created_at ON subscription_versions(owner_id, created_at DESC);
  `)
}
