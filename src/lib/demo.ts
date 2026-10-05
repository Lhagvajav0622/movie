/**
 * Placeholder catalog for the day-1 preview. Replaced by database queries on day 5.
 */
export type DemoTitle = {
  slug: string;
  name: string;
  year: number;
  hue: number; // used to draw a gradient poster until real posters exist
  vertical?: boolean;
  priceMnt: number;
};

const names = [
  "Од ба гэгээ",
  "Хаврын салхи",
  "Нууц гэрээ",
  "Тэнгэрийн хаан",
  "Эзэн хааны сүйт бүсгүй",
  "Хоёр дахь амьдрал",
  "Шөнийн хот",
  "Алтан эрин",
  "Хайрын шивнээ",
  "Сүүлчийн илгээмж",
];

export const demoTitles: DemoTitle[] = names.map((name, i) => ({
  slug: `demo-${i + 1}`,
  name,
  year: 2024 + (i % 3),
  hue: (i * 37) % 360,
  vertical: i % 2 === 0,
  priceMnt: i % 4 === 0 ? 0 : 4000,
}));

export const demoGenres = ["Инээдмийн", "Тулаант", "Аймшгийн", "Романс", "Драм", "Анимэйшн"];
