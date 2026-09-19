PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, event_name TEXT NOT NULL, session_id TEXT, path TEXT, question_id TEXT, result_id TEXT,
  utm_source TEXT, utm_campaign TEXT, referrer TEXT, device_class TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_result_id ON events(result_id);
CREATE INDEX IF NOT EXISTS idx_events_campaign ON events(utm_source, utm_campaign);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY, session_id TEXT, result_id TEXT, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  helpful INTEGER CHECK (helpful IN (0,1)), comment TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_result_id ON feedback(result_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, session_id TEXT, contact TEXT, category TEXT NOT NULL CHECK (category IN ('technical','billing','account','content','suggestion','other')),
  message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_support_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_created_at ON support_tickets(created_at);
