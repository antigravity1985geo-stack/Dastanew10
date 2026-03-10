-- ─────────────────────────────────────────────────────────────
-- RS.GE Idempotency Store
-- Check-before-Send: ზედნადების დუბლიკატის თავიდან ასარიდებლად
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rsge_idempotency (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,       -- idempotencyKey (e.g. sale.id + timestamp)
  waybill_id  TEXT NOT NULL,              -- RS.GE-დან მიღებული waybill ID
  status      TEXT NOT NULL DEFAULT 'success', -- 'success' | 'failed'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL        -- 48 საათის შემდეგ ამოიწურება
);

-- Index სწრაფი lookup-ისთვის
CREATE INDEX IF NOT EXISTS idx_rsge_idempotency_key ON rsge_idempotency (key);
CREATE INDEX IF NOT EXISTS idx_rsge_idempotency_expires ON rsge_idempotency (expires_at);

-- Row Level Security
ALTER TABLE rsge_idempotency ENABLE ROW LEVEL SECURITY;

-- Service role (server-side) — სრული წვდომა
CREATE POLICY "Service role has full access to rsge_idempotency"
  ON rsge_idempotency
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon/authenticated — მხოლოდ წაკითხვა (UI-ს არ სჭირდება, მაგრამ safe)
CREATE POLICY "Authenticated can select rsge_idempotency"
  ON rsge_idempotency
  FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- Auto-cleanup: ვადაგასული ჩანაწერების ამოშლა (Cron Job)
-- Supabase-ზე: Database → Extensions → pg_cron
-- ─────────────────────────────────────────────────────────────

-- SELECT cron.schedule(
--   'cleanup-rsge-idempotency',
--   '0 2 * * *',  -- ყოველ ღამე 02:00-ზე
--   $$DELETE FROM rsge_idempotency WHERE expires_at < NOW()$$
-- );

-- ─────────────────────────────────────────────────────────────
-- Manual cleanup query (თუ cron არ გაქვთ)
-- DELETE FROM rsge_idempotency WHERE expires_at < NOW();
-- ─────────────────────────────────────────────────────────────
