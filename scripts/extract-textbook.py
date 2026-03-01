#!/usr/bin/env python3
"""
Извлекает содержимое учебника из PDF и сохраняет в JSON.
Учебник: История Древнего мира, 5 класс (Кошелев, часть 2, 2019)
"""

import fitz  # PyMuPDF
import json
import re
import os

PDF_PATH = "/Users/macbookpro_ma-ko/Downloads/Istoriya_Dr_mira_5kl_Koshelev_ch2_rus_2019.pdf"
OUT_JSON = os.path.join(os.path.dirname(__file__), "../src/data/textbook.json")

# Разделы учебника
SECTIONS = [
    {"id": "ancient-greece", "title": "Древняя Греция", "paragraphs": list(range(1, 17))},
    {"id": "ancient-rome", "title": "Древний Рим", "paragraphs": list(range(17, 30))},
    {"id": "germanic-slavic", "title": "Древние германцы и славяне", "paragraphs": list(range(30, 32))},
]

# Маркеры карт для каждого параграфа
MAP_MARKERS = {
    1:  [{"name": "Афины", "lat": 37.97, "lng": 23.72, "description": "Главный полис Древней Греции"},
         {"name": "Спарта", "lat": 37.07, "lng": 22.43, "description": "Полис, прославившийся воинами"},
         {"name": "Олимп", "lat": 40.09, "lng": 22.36, "description": "Самая высокая гора Греции — обитель богов"}],
    2:  [{"name": "Крит", "lat": 35.24, "lng": 24.81, "description": "Остров, колыбель минойской цивилизации"},
         {"name": "Кносс", "lat": 35.30, "lng": 25.16, "description": "Дворец легендарного царя Миноса"}],
    3:  [{"name": "Микены", "lat": 37.73, "lng": 22.76, "description": "Центр микенской цивилизации"}],
    4:  [{"name": "Марафон", "lat": 38.15, "lng": 24.03, "description": "Победа греков над персами (490 до н. э.)"},
         {"name": "Фермопилы", "lat": 38.80, "lng": 22.54, "description": "300 спартанцев против персов (480 до н. э.)"},
         {"name": "Саламин", "lat": 37.95, "lng": 23.49, "description": "Морская победа греков над персами"}],
    5:  [{"name": "Афины (Акрополь)", "lat": 37.97, "lng": 23.73, "description": "Парфенон — храм богини Афины"}],
    10: [{"name": "Олимпия", "lat": 37.64, "lng": 21.63, "description": "Место проведения Олимпийских игр"}],
    12: [{"name": "Македония", "lat": 40.52, "lng": 22.00, "description": "Царство Александра Македонского"},
         {"name": "Персеполь", "lat": 29.93, "lng": 52.89, "description": "Столица Персидской державы"},
         {"name": "Александрия", "lat": 31.20, "lng": 29.92, "description": "Город, основанный Александром в Египте"}],
    20: [{"name": "Рим", "lat": 41.90, "lng": 12.49, "description": "Вечный город, столица Римской республики"},
         {"name": "Тибр", "lat": 41.73, "lng": 12.23, "description": "Река, на которой стоит Рим"}],
    21: [{"name": "Карфаген", "lat": 36.85, "lng": 10.33, "description": "Соперник Рима в Пунических войнах"}],
    32: [{"name": "Равенна", "lat": 44.42, "lng": 12.20, "description": "Последняя столица Западной Рима"}],
    33: [{"name": "Германские леса", "lat": 51.16, "lng": 10.45, "description": "Земли древних германских племён"}],
    34: [{"name": "Восточная Европа", "lat": 50.45, "lng": 30.52, "description": "Территория древних славян"}],
}


def get_section_id(paragraph_num):
    for section in SECTIONS:
        if paragraph_num in section["paragraphs"]:
            return section["id"]
    return "unknown"


def extract_pages(pdf_path):
    """Извлекает весь текст из PDF постранично."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({"page": page_num + 1, "text": text})
    doc.close()
    return pages


def find_paragraph_boundaries(pages):
    """
    Находит страницы начала каждого параграфа.
    Ищет паттерн '§ N.' в тексте, пропуская оглавление (первые 7 страниц).
    """
    para_starts = {}
    para_titles = {}

    SKIP_PAGES = 6  # оглавление и предисловие

    for page_data in pages:
        page_num = page_data["page"]
        if page_num <= SKIP_PAGES:
            continue

        text = page_data["text"]

        # Паттерн: "§ N." или "§N." где N — 1..31
        matches = list(re.finditer(r'§\s*(\d{1,2})\.\s+(.{5,80}?)(?:\n|$)', text))
        for m in matches:
            num = int(m.group(1))
            title_raw = m.group(2).strip()
            if 1 <= num <= 31 and num not in para_starts:
                para_starts[num] = page_num
                para_titles[num] = title_raw

    return para_starts, para_titles


def get_paragraph_text(pages, start_page, end_page):
    """Извлекает текст параграфа по диапазону страниц."""
    parts = []
    for page_data in pages:
        if start_page <= page_data["page"] < end_page:
            parts.append(page_data["text"])
    return "\n".join(parts)


def extract_questions_after_summary(text):
    """
    Извлекает вопросы из раздела после 'ПОДВЕДЕМ ИТОГИ'.
    Вопросы пронумерованы: 1. ... 2. ... 3. ...
    """
    questions = []

    # Ищем блок после "ПОДВЕДЕМ ИТОГИ"
    summary_match = re.search(
        r'ПОДВЕДЕМ\s+ИТОГИ.*?(?=\n\n|\Z)',
        text, re.DOTALL | re.IGNORECASE
    )

    # Берём текст после "ПОДВЕДЕМ ИТОГИ"
    after_summary = text
    if summary_match:
        after_summary = text[summary_match.end():]

    # Ищем нумерованные вопросы: "1. ...?" или "1. ... 2."
    # Паттерн: цифра, точка, текст до следующей цифры с точкой
    q_pattern = re.compile(
        r'\b(\d+)\.\s+([А-ЯЁа-яёA-Za-z][^.]*?[?.])',
        re.DOTALL
    )

    matches = q_pattern.findall(after_summary)
    seen_nums = set()
    for num_str, q_text in matches:
        num = int(num_str)
        if num in seen_nums or num > 10:
            continue
        q = re.sub(r'\s+', ' ', q_text).strip()
        if len(q) > 15:
            questions.append(q[:350])
            seen_nums.add(num)
        if len(questions) >= 6:
            break

    # Fallback: ищем предложения с вопросительным знаком
    if not questions:
        q_sentences = re.findall(r'[А-ЯЁ][^?]{15,200}\?', after_summary)
        for q in q_sentences[:5]:
            q_clean = re.sub(r'\s+', ' ', q).strip()
            questions.append(q_clean)

    return questions if questions else [
        "Расскажите о главных событиях параграфа.",
        "Что нового вы узнали из этого параграфа?",
    ]


def extract_dates(text):
    """Извлекает исторические даты из текста."""
    dates = []
    # Форматы: "490 до н. э.", "XVI в. до н. э.", "III тысячелетия до н. э."
    pattern = re.compile(
        r'(\d+(?:\s*[–—-]\s*\d+)?\s+(?:до\s+н\.?\s*э\.?|н\.?\s*э\.?)'
        r'|(?:[IVXLCDM]+|(?:\d+))\s+в\.?\s+до\s+н\.?\s*э\.?'
        r'|(?:III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\s+(?:тыс\.|тысячелет\w+)'
        r'(?:\s+до\s+н\.?\s*э\.?)?)',
        re.IGNORECASE
    )
    seen = set()
    for m in pattern.finditer(text):
        date_str = re.sub(r'\s+', ' ', m.group(0)).strip()
        if date_str in seen:
            continue
        # Контекст после даты
        end = m.end()
        context = text[end:end + 100].strip()
        context = re.sub(r'\s+', ' ', context)[:80]
        if context:
            dates.append({"date": date_str, "event": context})
            seen.add(date_str)
        if len(dates) >= 6:
            break
    return dates


def extract_terms(text):
    """Извлекает термины из текста."""
    terms = []
    # Паттерн: Слово — определение (тире — определение)
    pattern = re.compile(
        r'\b([А-ЯЁ][а-яёА-ЯЁ\s]{2,25})\s*[—–]\s*([а-яё][^.!?]{15,100}[.!?])',
        re.MULTILINE
    )
    seen = set()
    for m in pattern.finditer(text):
        term = m.group(1).strip()
        definition = m.group(2).strip()
        if term in seen or len(term) < 4:
            continue
        # Фильтруем заголовки (слишком длинные)
        if len(term) > 25:
            continue
        terms.append({"term": term, "definition": definition[:150]})
        seen.add(term)
        if len(terms) >= 8:
            break
    return terms


def extract_summary(text):
    """Извлекает раздел 'ПОДВЕДЕМ ИТОГИ'."""
    match = re.search(
        r'ПОДВЕДЕМ\s+ИТОГИ\s*(.*?)(?=\n\s*\d+\.|МИФ\s|§\s*\d+|\Z)',
        text, re.DOTALL | re.IGNORECASE
    )
    if match:
        summary = re.sub(r'\s+', ' ', match.group(1)).strip()
        return summary[:500]
    return ""


def build_textbook_json(pages):
    para_starts, para_titles_from_pdf = find_paragraph_boundaries(pages)
    print(f"Найдены параграфы: {sorted(para_starts.keys())}")

    # Если какие-то параграфы не найдены — выводим предупреждение
    missing = [n for n in range(1, 32) if n not in para_starts]
    if missing:
        print(f"ПРЕДУПРЕЖДЕНИЕ: не найдены §: {missing}")

    paragraphs = {}
    sorted_nums = sorted(para_starts.keys())

    for i, num in enumerate(sorted_nums):
        start_page = para_starts[num]
        end_page = para_starts[sorted_nums[i + 1]] if i + 1 < len(sorted_nums) else pages[-1]["page"] + 1

        raw_text = get_paragraph_text(pages, start_page, end_page)

        title = para_titles_from_pdf.get(num, f"Параграф {num}")
        questions = extract_questions_after_summary(raw_text)
        dates = extract_dates(raw_text)
        terms = extract_terms(raw_text)
        summary = extract_summary(raw_text)
        markers = MAP_MARKERS.get(num, [])
        section_id = get_section_id(num)

        content = re.sub(r'\s+', ' ', raw_text).strip()

        paragraphs[str(num)] = {
            "id": num,
            "sectionId": section_id,
            "title": title,
            "content": content[:4000],
            "summary": summary,
            "questions": questions,
            "dates": dates,
            "terms": terms,
            "mapMarkers": markers,
        }

        print(f"  §{num}: '{title[:50]}' — вопросов: {len(questions)}, дат: {len(dates)}, терминов: {len(terms)}")

    return {"sections": SECTIONS, "paragraphs": paragraphs}


def main():
    print(f"Открываю PDF: {PDF_PATH}")
    if not os.path.exists(PDF_PATH):
        print(f"ОШИБКА: файл не найден: {PDF_PATH}")
        return

    pages = extract_pages(PDF_PATH)
    print(f"Страниц в PDF: {len(pages)}")

    data = build_textbook_json(pages)

    out_path = os.path.abspath(OUT_JSON)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nГотово! Сохранено в: {out_path}")
    print(f"Параграфов: {len(data['paragraphs'])}")


if __name__ == "__main__":
    main()
