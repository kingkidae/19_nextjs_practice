// 실행: node --test lib/bigkinds.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBigKinds } from "./bigkinds.ts";

test("기사 목록: 제목·언론사·날짜·URL 만 남기고 본문은 버린다", () => {
  const rows = [
    ["뉴스 식별자", "일자", "언론사", "기고자", "제목", "본문", "URL"],
    ["1", "20261121", "예시일보", "홍길동", "입법 공백 장기화", "본문 전체...", "https://news.example/1"],
    ["2", "20261114", "샘플신문", "", "약물 도입 논의", "본문...", "javascript:alert(1)"],
  ];
  const out = parseBigKinds("articles", rows);
  assert.deepEqual(out, [
    { title: "입법 공백 장기화", press: "예시일보", date: "2026-11-21", url: "https://news.example/1" },
    { title: "약물 도입 논의", press: "샘플신문", date: "2026-11-14", url: "https://www.bigkinds.or.kr/" },
  ]);
});

test("키워드 트렌드: 위쪽 안내 행을 건너뛰고 쉼표 숫자를 읽는다", () => {
  const rows = [["키워드 트렌드 분석 결과"], [], ["일자", "건수"], ["2026-10", "1,204"], ["2026-11", 377]];
  assert.deepEqual(parseBigKinds("trend", rows), [
    { date: "2026-10", count: 1204 },
    { date: "2026-11", count: 377 },
  ]);
});

test("연관어: 가중치 열이 없으면 순위로 가중치를 만든다", () => {
  const out = parseBigKinds("keywords", [["순위", "연관어"], [1, "헌법불합치"], [2, "자기결정권"]]);
  assert.deepEqual(out, [{ word: "헌법불합치", weight: 40 }, { word: "자기결정권", weight: 39 }]);
});

test("필수 열이 없으면 머리글을 보여 주며 실패한다", () => {
  assert.throws(() => parseBigKinds("trend", [["아무거나", "열"], ["a", "b"]]), /일자/);
});
