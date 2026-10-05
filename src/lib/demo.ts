/**
 * Placeholder catalog for the preview. Replaced by database queries once titles are uploaded (day 4–5).
 */
import type { GenreItem } from "@/components/catalog/GenreSection";

export const demoGenres = ["Инээдмийн", "Тулаант", "Аймшгийн", "Романс", "Драм", "Анимэйшн"];

const rows: [string, number, string[], boolean][] = [
  ["Од ба гэгээ", 2025, ["Романс", "Драм"], true],
  ["Хаврын салхи", 2024, ["Романс"], true],
  ["Нууц гэрээ", 2025, ["Драм", "Тулаант"], false],
  ["Тэнгэрийн хаан", 2024, ["Тулаант"], false],
  ["Эзэн хааны сүйт бүсгүй", 2025, ["Романс", "Драм"], true],
  ["Хоёр дахь амьдрал", 2024, ["Драм"], true],
  ["Шөнийн хот", 2023, ["Аймшгийн"], false],
  ["Алтан эрин", 2025, ["Инээдмийн"], false],
  ["Хайрын шивнээ", 2024, ["Романс", "Инээдмийн"], true],
  ["Сүүлчийн илгээмж", 2023, ["Тулаант", "Драм"], false],
  ["Бяцхан луу", 2024, ["Анимэйшн", "Инээдмийн"], false],
  ["Мөнхийн тангараг", 2025, ["Романс"], true],
];

export const demoTitles: (GenreItem & { vertical: boolean })[] = rows.map(([name, year, genres, vertical], i) => ({
  slug: `demo-${i + 1}`,
  name,
  year,
  genres,
  vertical,
  hue: (i * 37 + 200) % 360,
  priceMnt: i % 4 === 0 ? 0 : 4000,
  durationSec: vertical ? 60 * 95 : 60 * (100 + i * 4),
  ageRating: i % 3 === 0 ? "+18" : "+13",
  description:
    "Хотын захын жижиг кафед ажилладаг залуу бүсгүй нэгэн шөнө үл таних эртэй учирснаар хоёр гэр бүлийн олон жилийн нууц ил болж эхэлнэ.",
}));
