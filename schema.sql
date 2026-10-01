CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    flag TEXT NOT NULL DEFAULT '🎓',
    city TEXT NOT NULL,
    qs_rank INTEGER NOT NULL DEFAULT 0 CHECK (qs_rank >= 0),
    the_rank INTEGER NOT NULL DEFAULT 0 CHECK (the_rank >= 0),
    shanghai_rank INTEGER NOT NULL DEFAULT 0 CHECK (shanghai_rank >= 0),
    residency_available INTEGER NOT NULL DEFAULT 0 CHECK (residency_available IN (0, 1)),
    degrees_json TEXT NOT NULL DEFAULT '[]',
    funding_type TEXT NOT NULL DEFAULT 'Self-funded',
    funding_by_degree_json TEXT NOT NULL DEFAULT '{}',
    campus_image TEXT NOT NULL DEFAULT '',
    campus_image_source TEXT NOT NULL DEFAULT '',
    campus_image_credit TEXT NOT NULL DEFAULT '',
    req_cv TEXT NOT NULL DEFAULT '',
    req_video TEXT NOT NULL DEFAULT '',
    req_interview TEXT NOT NULL DEFAULT '',
    req_tests TEXT NOT NULL DEFAULT '',
    sat_required INTEGER NOT NULL DEFAULT 0 CHECK (sat_required IN (0, 1)),
    essays_json TEXT NOT NULL DEFAULT '[]',
    official_url TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS catalog_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
