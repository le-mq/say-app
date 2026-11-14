-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    audiophile_rank VARCHAR(50) DEFAULT 'Novice Listener',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure role column exists if table was created in an earlier migration
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
    END IF;
END $$;

-- Table: friendships
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_friendships_requester_addressee UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester_addressee_status 
    ON friendships (requester_id, addressee_id, status);

-- Table: notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    song_image_url TEXT NOT NULL,
    external_song_url TEXT NOT NULL,
    audio_snippet_start INT DEFAULT 0,
    caption TEXT,
    lyric_snippet TEXT,
    template_type VARCHAR(50) CHECK (template_type IN ('RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL', 'GALAXY')),
    emotion_tag VARCHAR(50),
    sticker_badge TEXT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'FRIENDS_ONLY')),
    likes_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    liked_user_ids TEXT DEFAULT '',
    saved_user_ids TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure likes_count, saves_count, liked_user_ids, saved_user_ids exist if table was created in an earlier migration
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE notes ADD COLUMN likes_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'saves_count'
    ) THEN
        ALTER TABLE notes ADD COLUMN saves_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'liked_user_ids'
    ) THEN
        ALTER TABLE notes ADD COLUMN liked_user_ids TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'saved_user_ids'
    ) THEN
        ALTER TABLE notes ADD COLUMN saved_user_ids TEXT DEFAULT '';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notes_user_created_at 
    ON notes (user_id, created_at);

-- Table: note_replies
CREATE TABLE IF NOT EXISTS note_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    song_image_url TEXT NOT NULL,
    external_song_url TEXT NOT NULL,
    reply_caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_replies_parent_note_id 
    ON note_replies (parent_note_id);

-- Table: app_configs (Dynamic configuration & Feature Flags)
CREATE TABLE IF NOT EXISTS app_configs (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications (In-app real-time alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
    ON notifications (recipient_id, is_read, created_at DESC);

-- Backward compatibility patches
ALTER TABLE notes ALTER COLUMN sticker_badge TYPE TEXT;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_template_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_template_type_check CHECK (template_type IN ('RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL', 'GALAXY'));
