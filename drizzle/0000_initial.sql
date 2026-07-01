CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS teams (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  sport text NOT NULL,
  conference text NOT NULL,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL REFERENCES teams(slug),
  year integer NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_slug, year)
);

CREATE TABLE IF NOT EXISTS games (
  id text PRIMARY KEY,
  team_slug text NOT NULL REFERENCES teams(slug),
  season_year integer NOT NULL,
  opponent text NOT NULL,
  site text NOT NULL,
  starts_at timestamp with time zone,
  venue text,
  tv text,
  source_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_documents (
  id text PRIMARY KEY,
  team_slug text NOT NULL REFERENCES teams(slug),
  provider text NOT NULL,
  source_type text NOT NULL,
  source_url text,
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamp with time zone,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_chunks (
  id text PRIMARY KEY,
  source_document_id text NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_estimate integer NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_slug text NOT NULL REFERENCES teams(slug),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answer_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  source_document_id text REFERENCES source_documents(id),
  quote text,
  source_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS games_team_season_idx ON games(team_slug, season_year);
CREATE INDEX IF NOT EXISTS source_documents_team_provider_idx ON source_documents(team_slug, provider);
CREATE INDEX IF NOT EXISTS source_chunks_document_idx ON source_chunks(source_document_id);
CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx ON source_chunks USING hnsw (embedding vector_cosine_ops);
