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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Ensure sticker_badge column is TEXT in existing database
ALTER TABLE notes ALTER COLUMN sticker_badge TYPE TEXT;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_template_type_check;
ALTER TABLE notes ADD CONSTRAINT notes_template_type_check CHECK (template_type IN ('RECEIPTIFY', 'CASSETTE', 'STAMP', 'VINYL', 'GALAXY'));
