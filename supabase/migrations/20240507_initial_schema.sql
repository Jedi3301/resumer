CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT,
    goal_profile JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resumes (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    raw_text TEXT,
    parsed_json JSONB,
    health_score JSONB,
    storage_url TEXT,
    embedding_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE job_listings (
    id UUID PRIMARY KEY,
    title TEXT,
    company TEXT,
    url TEXT,
    jd_text TEXT,
    posted_at DATE,
    source TEXT,
    match_score FLOAT,
    embedding_id TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    job_id UUID REFERENCES job_listings(id),
    status TEXT,
    match_score FLOAT,
    gap_analysis JSONB,
    battle_plan JSONB,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
