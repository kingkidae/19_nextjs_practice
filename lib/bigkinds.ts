// 빅카인즈에서 내려받은 엑셀의 행을 topic_stats 의 JSON 형태로 바꾼다.
// shortcut: 열 이름은 빅카인즈 다운로드 양식을 추정한 후보 목록으로 찾는다. 실제 양식이 다르면 아래 후보에 열 이름을 추가할 것.

export type StatKind = "articles" | "trend" | "keywords" | "relations";
type Cell = string | number | Date | null | undefined;

const CANDIDATES = {
  title: ["제목", "title"],
  press: ["언론사", "press", "매체"],
  date: ["일자", "날짜", "date", "기간"],
  url: ["url", "링크", "원문"],
  count: ["건수", "빈도", "count", "기사수", "문서수"],
  word: ["키워드", "연관어", "단어", "keyword", "word"],
  weight: ["가중치", "weight", "빈도", "건수", "점수"],
  name: ["이름", "개체", "개체명", "name", "키워드"],
  type: ["유형", "구분", "type", "분류"],
};

function findCol(header: string[], keys: string[]) {
  const norm = header.map((h) => h.replace(/\s/g, "").toLowerCase());
  for (const k of keys) {
    const i = norm.findIndex((h) => h.includes(k.toLowerCase()));
    if (i >= 0) return i;
  }
  return -1;
}

function text(v: Cell) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v == null ? "" : String(v).trim();
}

function num(v: Cell) {
  const n = typeof v === "number" ? v : Number(text(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// 8자리 숫자 날짜(20261121)를 2026-11-21 로 맞춘다
function date(v: Cell) {
  const s = text(v);
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : s;
}

export function parseBigKinds(kind: StatKind, rows: Cell[][]) {
  const headerIdx = rows.findIndex((r) => r.filter((c) => text(c)).length >= 2);
  if (headerIdx < 0) throw new Error("엑셀에서 머리글 행을 찾지 못했습니다.");
  const header = rows[headerIdx].map(text);
  const body = rows.slice(headerIdx + 1).filter((r) => r.some((c) => text(c)));

  const need = (key: keyof typeof CANDIDATES) => {
    const i = findCol(header, CANDIDATES[key]);
    if (i < 0) throw new Error(`'${CANDIDATES[key][0]}' 열을 찾지 못했습니다. 머리글: ${header.join(", ")}`);
    return i;
  };

  switch (kind) {
    case "articles": {
      const [t, p, d] = [need("title"), need("press"), need("date")];
      const u = findCol(header, CANDIDATES.url);
      // 기사 본문은 가져오지 않는다: 제목·언론사·날짜·원문 링크만
      return body.slice(0, 50).map((r) => ({
        title: text(r[t]), press: text(r[p]), date: date(r[d]),
        url: u >= 0 && /^https?:\/\//.test(text(r[u])) ? text(r[u]) : "https://www.bigkinds.or.kr/",
      })).filter((a) => a.title);
    }
    case "trend": {
      const [d, c] = [need("date"), need("count")];
      return body.map((r) => ({ date: date(r[d]), count: num(r[c]) })).filter((x) => x.date);
    }
    case "keywords": {
      const w = need("word");
      const g = findCol(header.map((h, i) => (i === w ? "" : h)), CANDIDATES.weight);
      return body.slice(0, 40).map((r, i) => ({ word: text(r[w]), weight: g >= 0 ? num(r[g]) : 40 - i }))
        .filter((x) => x.word);
    }
    case "relations": {
      const n = need("name");
      const ty = findCol(header, CANDIDATES.type);
      const g = findCol(header.map((h, i) => (i === n ? "" : h)), CANDIDATES.weight);
      return body.slice(0, 30).map((r, i) => ({
        name: text(r[n]), type: ty >= 0 ? text(r[ty]) || "기타" : "기타", weight: g >= 0 ? num(r[g]) : 30 - i,
      })).filter((x) => x.name);
    }
  }
}
