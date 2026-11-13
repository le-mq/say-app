-- SAY Application Data Seeding
-- Preserves existing user profiles, notes, and relationships across restarts

-- 1. Insert existing users
INSERT INTO public.users (id, email, display_name, avatar_url, bio, audiophile_rank, created_at, updated_at, username, role)
VALUES 
  ('e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'lmq3107@gmail.com', 'Minh Quang', 'https://lh3.googleusercontent.com/a/ACg8ocJfB8jifNt_YJVp7Mu3oWDhS7tYjbB8BRPaQZfBfKVEaDmaYQ=s96-c', 'Curating timeless records on SAY.', 'Novice Listener', '2026-11-05 14:43:15.500475+00', '2026-11-12 15:06:02.561026+00', 'minhquang', 'ADMIN'),
  ('08f1746c-c4a1-4f88-a309-e65afc52483b', 'se190936leminhquang@gmail.com', 'Quang Lê Minh (SE190936)', 'https://lh3.googleusercontent.com/a/ACg8ocI1t_Ov438-kffSMEUMI9qMStJVnaDMnCqefyRcFv7bpMTx9w=s96-c', 'Curating timeless records on SAY.', 'Novice Listener', '2026-11-12 14:56:30.270179+00', '2026-11-12 15:06:25.220507+00', 'lmq', 'USER')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  username = COALESCE(users.username, EXCLUDED.username);

-- 2. Insert existing friendships
INSERT INTO public.friendships (id, requester_id, addressee_id, status, created_at, updated_at)
VALUES 
  ('eb7f8d9b-5bbf-400b-8f56-0707e84e632f', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', '08f1746c-c4a1-4f88-a309-e65afc52483b', 'PENDING', '2026-11-12 15:14:43.890244+00', '2026-11-12 15:14:43.890244+00')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert existing notes (11 music notes created by user)
INSERT INTO public.notes (id, user_id, song_title, artist_name, song_image_url, external_song_url, audio_snippet_start, caption, lyric_snippet, template_type, emotion_tag, sticker_badge, visibility, created_at)
VALUES 
  ('1adecf91-6eaf-493c-972b-0808590a9f2b', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'B Ray', '[UNhiddenGem Mixtape] 3. Cho Con (Lullaby pt.2)', 'https://i.ytimg.com/vi/ERABWON9Qck/mqdefault.jpg', 'https://www.youtube.com/watch?v=ERABWON9Qck', 49, 'this song feels like cold rain against a dimly lit train window', '', 'CASSETTE', 'Dreamy', 'Heartbeat', 'PUBLIC', '2026-11-05 15:18:39.218945+00'),
  ('25030cf3-abdf-465c-a938-6d5a8c28242e', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'B Ray (ft. V#)', 'Prod. Hipz', 'https://i.ytimg.com/vi/_XX248bq6Pw/mqdefault.jpg', 'https://www.youtube.com/watch?v=_XX248bq6Pw', 56, 'pov: driving home at 2:15 AM with this on loop', '', 'VINYL', 'Lonely', 'Rain Drops', 'PUBLIC', '2026-11-05 16:09:28.252029+00'),
  ('d649ea55-10d6-4aad-a004-b299e64ec41a', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Henry Moodie', 'drunk text', 'https://img.youtube.com/vi/OqEc_169ywY/hqdefault.jpg', 'https://www.youtube.com/watch?v=OqEc_169ywY', 46, 'this song feels like cold rain against a dimly lit train window', '', 'RECEIPTIFY', 'Nostalgic', 'Headphones', 'PUBLIC', '2026-11-07 09:49:33.852545+00'),
  ('967509d6-69dc-4326-9e9d-a3825f17c06d', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Bài Hát Buồn Nhất', 'Bray - Captain', 'https://img.youtube.com/vi/Dn2j473Xw-E/hqdefault.jpg', 'https://www.youtube.com/watch?v=Dn2j473Xw-E', 100, 'floating somewhere in orbit where no notifications can reach me', '', 'CASSETTE', 'Nostalgic', 'Heartbeat', 'PUBLIC', '2026-11-07 14:36:32.384788+00'),
  ('d8878982-d3c1-4110-a844-5ad953cbbcd7', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'UNETHICAL', 'Faouzia', 'https://img.youtube.com/vi/I1zqCX3Dvxo/hqdefault.jpg', 'https://www.youtube.com/watch?v=I1zqCX3Dvxo', 59, 'vintage tape hiss, warm matcha, and absolutely zero drama', 'vintage tape hiss, warm matcha, and absolutely zero drama', 'RECEIPTIFY', '💫 Dreamy', 'Flame Seal', 'PUBLIC', '2026-11-09 08:17:40.233408+00'),
  ('20f7ff73-cf6b-4a25-904f-a1d70c588d58', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Noo Phước Thịnh 🎼 Bản mel chuẩn TikTok', 'Cause I Love You (ctri Remix)', 'https://img.youtube.com/vi/hRRzUqHGzwM/hqdefault.jpg', 'https://www.youtube.com/watch?v=hRRzUqHGzwM#snippetDur=45', 142, '', '', 'CASSETTE', '🍃 Peaceful', 'Flame Seal', 'PUBLIC', '2026-11-09 16:50:52.337476+00'),
  ('089bfc11-b9ab-4438-9418-dd4f37ee5bc9', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Nếu Như Ta Chẳng Còn', 'MCK (ft. A$AP Ướt Mi)', 'https://img.youtube.com/vi/rYWLIJB214Q/hqdefault.jpg', 'https://www.youtube.com/watch?v=rYWLIJB214Q#snippetDur=45', 78, 'vintage tape hiss, warm matcha, and absolutely zero drama', 'vintage tape hiss, warm matcha, and absolutely zero drama', 'CASSETTE', '🪐 Cosmic Bliss', 'Rain Drops', 'PUBLIC', '2026-11-10 14:50:14.445881+00'),
  ('56166aef-0b61-409f-9ed5-ac907a6ae69a', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Thành Đô (Tuấn Siêu Remix x MinzHieu)', 'GUrbane', 'https://img.youtube.com/vi/Mrgmyhte_es/hqdefault.jpg', 'https://www.youtube.com/watch?v=Mrgmyhte_es#snippetDur=45', 153, 'pov: driving home at 2:15 AM with this on loop', 'pov: driving home at 2:15 AM with this on loop', 'CASSETTE', '🌙 Melancholic', 'Star Shimmer', 'FRIENDS_ONLY', '2026-11-11 09:06:52.325367+00'),
  ('995e66b6-6948-4e9b-beb9-9a9d0bb56f23', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Anh Vui', 'Phạm Kỳ (Duzme Remix)', 'https://img.youtube.com/vi/wt0k2Dn_4oE/hqdefault.jpg', 'https://www.youtube.com/watch?v=wt0k2Dn_4oE#snippetDur=45', 57, '', '', 'GALAXY', '🌙 Melancholic', 'Moon', 'PUBLIC', '2026-11-12 14:33:15.00978+00'),
  ('a1f2b0ea-8237-4c63-b6ab-0381fbaab203', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Địa Ngục Trần Gian (Thazh x Đông Remix)', 'Phạm Kỳ ♫ Những Cánh Hoa Rơi Theo Dòng Nước Mắt Remix', 'https://img.youtube.com/vi/05S2uf37ufc/hqdefault.jpg', 'https://www.youtube.com/watch?v=05S2uf37ufc#snippetDur=30', 30, 'vintage tape hiss, warm matcha, and absolutely zero drama', '', 'RECEIPTIFY', '🌧️ Lonely', 'Rain Drops', 'PUBLIC', '2026-11-08 14:36:50.770978+00'),
  ('24ccd28d-5f38-4619-a4de-8d6e14050cc7', 'e94df8ae-c585-44a5-a12c-bb1a3bb599f7', 'Madison Beer', 'Reckless', 'https://img.youtube.com/vi/TFHCew8DnC0/hqdefault.jpg', 'https://www.youtube.com/watch?v=TFHCew8DnC0#snippetDur=45', 87, '', '', 'VINYL', '📼 Nostalgic', 'Heartbeat', 'PUBLIC', '2026-11-06 14:40:39.833317+00')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial System Configs / Feature Flags
INSERT INTO public.app_configs (config_key, config_value, description, updated_at)
VALUES 
  ('MAINTENANCE_MODE', 'false', 'Global maintenance mode toggle (blocks standard user traffic)', CURRENT_TIMESTAMP),
  ('MAX_CAPTION_LENGTH', '150', 'Maximum characters allowed for note reflections/thoughts', CURRENT_TIMESTAMP),
  ('MAX_SNIPPET_DURATION', '60', 'Maximum audio snippet length in seconds (30, 45, 60)', CURRENT_TIMESTAMP),
  ('ALLOW_PUBLIC_REGISTRATION', 'true', 'Enable/disable new user sign-in registrations', CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;
