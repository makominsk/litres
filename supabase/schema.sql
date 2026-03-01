-- =============================================
-- Litres — Голосовой помощник по истории 5 класса
-- Схема базы данных Supabase
-- =============================================

-- Студенты (без пароля — только никнейм)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ответы на вопросы параграфов
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  paragraph_id INT NOT NULL,
  question_index INT NOT NULL,
  answer_text TEXT,
  is_correct BOOLEAN DEFAULT false,
  hint_level INT DEFAULT 0 CHECK (hint_level BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Уникальность: один ответ на один вопрос параграфа для ученика
  UNIQUE (student_id, paragraph_id, question_index)
);

-- Результаты тестов (по параграфу или разделу)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  paragraph_id INT,           -- NULL если тест по разделу
  section_id TEXT,            -- NULL если тест по параграфу
  score INT NOT NULL CHECK (score >= 0),
  total INT NOT NULL CHECK (total > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Кэш аудио ElevenLabs (экономия API запросов)
CREATE TABLE IF NOT EXISTS audio_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_hash TEXT UNIQUE NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Индексы для производительности
-- =============================================

CREATE INDEX IF NOT EXISTS idx_answers_student ON answers (student_id);
CREATE INDEX IF NOT EXISTS idx_answers_paragraph ON answers (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_quiz_student ON quiz_results (student_id);
CREATE INDEX IF NOT EXISTS idx_audio_hash ON audio_cache (text_hash);

-- =============================================
-- Row Level Security (RLS)
-- Включаем анонимный доступ через anon key
-- =============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- students: читать всем, создавать анонимно
CREATE POLICY "students_select" ON students FOR SELECT USING (true);
CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (true);

-- answers: читать и писать всем (идентификация по student_id)
CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "answers_update" ON answers FOR UPDATE USING (true);

-- quiz_results: читать и писать всем
CREATE POLICY "quiz_select" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "quiz_insert" ON quiz_results FOR INSERT WITH CHECK (true);

-- audio_cache: читать всем, писать всем (service role управляет)
CREATE POLICY "audio_select" ON audio_cache FOR SELECT USING (true);
CREATE POLICY "audio_insert" ON audio_cache FOR INSERT WITH CHECK (true);

-- =============================================
-- Storage bucket для аудио-кэша
-- Создать через Supabase Dashboard: Storage > New bucket > "audio-cache"
-- Public bucket: да
-- =============================================
