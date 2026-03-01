# Voice History Tutor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Интерактивный голосовой помощник по истории Древнего мира для учеников 5 класса с AI-пояснениями, озвучкой, картами и тестами.

**Architecture:** Next.js 14 (App Router) фронтенд с серверными API routes для Gemini и ElevenLabs. Supabase хранит текст учебника, прогресс и аудио-кэш. Статические изображения pre-generated. Деплой на Vercel.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, react-leaflet, Google AI Studio (Gemini), ElevenLabs, Supabase, Web Speech API

**Brainstorm:** `docs/brainstorms/2026-03-01-voice-history-tutor-brainstorm.md`

---

## Фаза 1: Фундамент проекта

### Task 1: Инициализация Next.js проекта

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `.env.local.example`, `.gitignore`

**Step 1: Создать Next.js проект**

```bash
cd "/Users/macbookpro_ma-ko/Documents/Вайбкодинг_курс 2/litres"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Step 2: Установить зависимости**

```bash
npm install @google/generative-ai elevenlabs zustand framer-motion react-leaflet leaflet @supabase/supabase-js
npm install -D @types/leaflet
```

**Step 3: Установить shadcn/ui**

```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog progress badge tooltip
```

**Step 4: Настроить .env.local.example**

```env
GOOGLE_AI_API_KEY=your_google_ai_studio_key
ELEVENLABS_API_KEY=your_elevenlabs_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: init Next.js 14 project with dependencies"
git push
```

---

### Task 2: Извлечение текста учебника из PDF

**Files:**
- Create: `scripts/extract-textbook.py`
- Create: `src/data/textbook.json`
- Create: `src/data/sections.json`

**Step 1: Написать скрипт извлечения**

Скрипт Python (PyMuPDF уже установлен) парсит PDF по параграфам, используя TOC:
- Разбивает текст по §§ (31 параграф)
- Для каждого § извлекает: заголовок, основной текст, раздел "Подведём итоги", вопросы
- Группирует по разделам (Греция, Рим, Германцы и Славяне)
- Сохраняет в JSON

```bash
python3 scripts/extract-textbook.py
```

Ожидаемый формат `textbook.json`:
```json
{
  "sections": [
    {
      "id": "ancient-greece",
      "title": "Древняя Греция",
      "paragraphs": [1, 2, ..., 16]
    }
  ],
  "paragraphs": {
    "1": {
      "id": 1,
      "sectionId": "ancient-greece",
      "title": "Природа и население Древней Греции",
      "content": "...",
      "summary": "...",
      "questions": ["Используя карту, опишите...", "Почему греки..."],
      "dates": [{"date": "III тыс. до н.э.", "event": "..."}],
      "terms": [{"term": "эллины", "definition": "..."}],
      "mapMarkers": [{"name": "Афины", "lat": 37.97, "lng": 23.72, "description": "..."}]
    }
  }
}
```

**Step 2: Запустить и проверить**

```bash
python3 scripts/extract-textbook.py
cat src/data/textbook.json | python3 -m json.tool | head -50
```

**Step 3: Commit**

```bash
git add scripts/extract-textbook.py src/data/
git commit -m "feat: extract textbook content from PDF to JSON"
```

---

### Task 3: Настройка Supabase

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase.ts`

**Step 1: Создать схему базы данных**

```sql
-- Прогресс ученика
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ответы на вопросы
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  paragraph_id INT NOT NULL,
  question_index INT NOT NULL,
  answer_text TEXT,
  is_correct BOOLEAN,
  hint_level INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Результаты тестов
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  paragraph_id INT,
  section_id TEXT,
  score INT NOT NULL,
  total INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Кэш аудио ElevenLabs
CREATE TABLE audio_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_hash TEXT UNIQUE NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Step 2: Создать Supabase клиент**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Step 3: Commit**

```bash
git add supabase/ src/lib/supabase.ts
git commit -m "feat: add Supabase schema and client"
```

---

## Фаза 2: API слой

### Task 4: API route — Gemini (анализ ответа ученика)

**Files:**
- Create: `src/app/api/evaluate/route.ts`
- Create: `src/lib/gemini.ts`
- Create: `src/lib/prompts.ts`

**Функция:** Принимает ответ ученика + контекст параграфа → возвращает пояснение (5-10 предложений) + оценку + интересный факт + сравнение с современностью + мнемоническую карточку.

Системный промпт включает ограничения безопасности (только образовательный контент, простой язык, дружелюбный тон).

**Step 1: Commit**

```bash
git add src/app/api/evaluate/ src/lib/gemini.ts src/lib/prompts.ts
git commit -m "feat: add Gemini API route for answer evaluation"
```

---

### Task 5: API route — ElevenLabs (озвучка)

**Files:**
- Create: `src/app/api/tts/route.ts`
- Create: `src/lib/elevenlabs.ts`

**Функция:** Принимает текст → проверяет кэш (audio_cache в Supabase) → если нет, генерирует через ElevenLabs API → сохраняет в кэш → возвращает аудио URL.

Мужской русский голос. Параметры: stability 0.5, similarity_boost 0.75.

**Step 1: Commit**

```bash
git add src/app/api/tts/ src/lib/elevenlabs.ts
git commit -m "feat: add ElevenLabs TTS API route with caching"
```

---

### Task 6: API route — Подсказки (3 уровня)

**Files:**
- Create: `src/app/api/hint/route.ts`

**Функция:** Принимает paragraph_id + question_index + hint_level (1-3) → Gemini генерирует подсказку нужного уровня:
- Level 1: лёгкий наводящий вопрос
- Level 2: конкретный намёк с контекстом
- Level 3: полный ответ с пояснением

**Step 1: Commit**

```bash
git add src/app/api/hint/
git commit -m "feat: add hint API with 3 difficulty levels"
```

---

### Task 7: API routes — Прогресс ученика

**Files:**
- Create: `src/app/api/student/route.ts`
- Create: `src/app/api/progress/route.ts`

**Функция:**
- POST `/api/student` — создать/найти ученика по никнейму
- GET/POST `/api/progress` — получить/сохранить прогресс (ответы, результаты тестов)

**Step 1: Commit**

```bash
git add src/app/api/student/ src/app/api/progress/
git commit -m "feat: add student progress API routes"
```

---

## Фаза 3: Frontend — основные страницы

### Task 8: Общий layout и тема (Frontend Skill)

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/globals.css` (античная тема)
- Create: `src/components/ui/header.tsx`
- Create: `src/components/ui/scroll-animation.tsx`
- Create: `src/stores/app-store.ts` (Zustand)

**Функция:** Античная тема (пергамент, терракота), шрифты Merriweather + Nunito, общий layout с header. Zustand store для глобального состояния. Framer Motion анимации загрузки (свиток).

→ **Использовать Frontend Design Skill**

**Step 1: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/ src/stores/
git commit -m "feat: add antique theme layout with animations"
```

---

### Task 9: Главная страница — карта и выбор раздела (Frontend Skill)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/home/section-card.tsx`
- Create: `src/components/home/world-map.tsx`
- Create: `src/components/onboarding/tour.tsx`

**Функция:**
- Карта Древнего мира (react-leaflet) с 3 регионами (кликабельные)
- Карточки разделов: Древняя Греция, Древний Рим, Германцы и Славяне
- Онбординг тур при первом визите (3-4 шага)
- Ввод никнейма при первом входе

→ **Использовать Frontend Design Skill**

**Step 1: Commit**

```bash
git add src/app/page.tsx src/components/home/ src/components/onboarding/
git commit -m "feat: add home page with world map and section cards"
```

---

### Task 10: Страница раздела — список параграфов

**Files:**
- Create: `src/app/section/[id]/page.tsx`
- Create: `src/components/section/paragraph-list.tsx`
- Create: `src/components/section/progress-bar.tsx`

**Функция:**
- Список всех параграфов раздела с прогрессом (медали, процент выполнения)
- Кнопка "Обобщающий тест" (доступна всегда)
- Кнопка "Итоги по разделу"

**Step 1: Commit**

```bash
git add src/app/section/
git commit -m "feat: add section page with paragraph list"
```

---

### Task 11: Страница параграфа — вопросы и ответы (ключевая)

**Files:**
- Create: `src/app/paragraph/[id]/page.tsx`
- Create: `src/components/paragraph/question-card.tsx`
- Create: `src/components/paragraph/voice-input.tsx`
- Create: `src/components/paragraph/text-input.tsx`
- Create: `src/components/paragraph/explanation-card.tsx`
- Create: `src/components/paragraph/fun-fact.tsx`
- Create: `src/components/paragraph/hint-button.tsx`
- Create: `src/components/paragraph/mnemonic-card.tsx`
- Create: `src/components/paragraph/term-tooltip.tsx`
- Create: `src/components/paragraph/event-map.tsx`
- Create: `src/hooks/use-speech-recognition.ts`
- Create: `src/hooks/use-audio-player.ts`

**Функция:**
- Поэтапное отображение вопросов (один на экран)
- Вступление с иллюстрацией + озвучка
- "Ты знал?" факт перед каждым вопросом
- Голосовой ввод (Web Speech API) + текстовый fallback
- Отправка ответа → Gemini → пояснение + озвучка
- Кнопка "Подскажи" (3 уровня)
- Мнемоническая карточка после каждого ответа
- Мини-словарь терминов (tooltip)
- Карта событий параграфа (react-leaflet)
- Анимации: появление карточек, пульсация микрофона, свиток загрузки
- Звуки: правильный ответ, подсказка

→ **Использовать Frontend Design Skill**

**Step 1: Commit**

```bash
git add src/app/paragraph/ src/components/paragraph/ src/hooks/
git commit -m "feat: add paragraph page with Q&A flow, voice input, maps"
```

---

## Фаза 4: Тесты и повторение

### Task 12: Тест по параграфу (даты)

**Files:**
- Create: `src/app/paragraph/[id]/quiz/page.tsx`
- Create: `src/components/quiz/date-card.tsx`
- Create: `src/components/quiz/timeline-drag.tsx`
- Create: `src/components/quiz/result-screen.tsx`
- Create: `src/components/quiz/medal.tsx`
- Create: `src/components/quiz/share-card.tsx`

**Функция:**
- Интерактивные карточки с датами (выбор правильного события)
- Таймлайн с drag-and-drop (перетащи событие на дату)
- Экран результата: оценка, медаль (бронза/серебро/золото)
- Кнопка "Поделиться" (скриншот-карточка)
- Медаль заблокирована пока не все ответы верные

**Step 1: Commit**

```bash
git add src/app/paragraph/*/quiz/ src/components/quiz/
git commit -m "feat: add paragraph quiz with timeline and medals"
```

---

### Task 13: Режим повторения ошибок

**Files:**
- Create: `src/app/paragraph/[id]/review/page.tsx`
- Create: `src/components/review/review-card.tsx`

**Функция:**
- Показывает только вопросы, где ученик ошибся
- Те же механики (голос/текст, пояснения, подсказки)
- После правильного ответа вопрос снимается с повторения
- Когда все вопросы пройдены → разблокирует медаль

**Step 1: Commit**

```bash
git add src/app/paragraph/*/review/ src/components/review/
git commit -m "feat: add review mode for wrong answers"
```

---

### Task 14: Обобщающий тест по разделу

**Files:**
- Create: `src/app/section/[id]/quiz/page.tsx`
- Create: `src/app/section/[id]/summary/page.tsx`

**Функция:**
- Тест по всем параграфам раздела (даты, события, персоналии)
- Сводка перед тестом: какие §§ пройдены, где пробелы
- Итоги: общий результат по разделу

**Step 1: Commit**

```bash
git add src/app/section/*/quiz/ src/app/section/*/summary/
git commit -m "feat: add section quiz and summary pages"
```

---

## Фаза 5: Pre-generation контента

### Task 15: Генерация иллюстраций через Google AI Studio

**Files:**
- Create: `scripts/generate-images.py`
- Create: `public/images/paragraphs/` (31 папка)

**Функция:** Скрипт генерирует по 3-5 иллюстраций для каждого параграфа через Google AI Studio. Исторические сцены, карты, портреты. Сохраняет в `public/images/`.

**Step 1: Commit**

```bash
git add scripts/generate-images.py public/images/
git commit -m "feat: generate paragraph illustrations"
```

---

### Task 16: Pre-generate аудио вопросов (ElevenLabs)

**Files:**
- Create: `scripts/generate-audio.py`
- Create: `public/audio/` (вступления + вопросы)

**Функция:** Скрипт озвучивает фиксированные тексты: вступления к параграфам и вопросы. Сохраняет как mp3 в `public/audio/`.

**Step 1: Commit**

```bash
git add scripts/generate-audio.py public/audio/
git commit -m "feat: pre-generate audio for questions and intros"
```

---

## Фаза 6: Финализация и деплой

### Task 17: Звуковой дизайн

**Files:**
- Create: `public/sounds/correct.mp3`
- Create: `public/sounds/medal.mp3`
- Create: `public/sounds/hint.mp3`
- Create: `public/sounds/ambient-greece.mp3`
- Create: `public/sounds/ambient-rome.mp3`

**Функция:** Добавить звуковые эффекты для UI событий и фоновую атмосферу.

---

### Task 18: Деплой на Vercel

**Files:**
- Create: `vercel.json` (при необходимости)

**Steps:**
1. Подключить GitHub репо makominsk/litres к Vercel
2. Настроить Environment Variables (GOOGLE_AI_API_KEY, ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
3. Deploy
4. Проверить на мобильном устройстве

---

## Порядок выполнения

```
Фаза 1: Фундамент          → Task 1, 2, 3     (параллельно 2+3 после 1)
Фаза 2: API                → Task 4, 5, 6, 7  (параллельно)
Фаза 3: Frontend            → Task 8 → 9 → 10 → 11 (последовательно)
Фаза 4: Тесты              → Task 12, 13, 14  (параллельно)
Фаза 5: Контент            → Task 15, 16      (параллельно)
Фаза 6: Финализация        → Task 17, 18      (последовательно)
```
