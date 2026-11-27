// OG 이미지 공통: 한글 글꼴(Black Han Sans)을 필요한 글자만 받아 온다
export const OG_SIZE = { width: 1200, height: 630 };

export async function loadDisplayFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Black+Han+Sans&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null; // 글꼴을 못 받으면 기본 글꼴로 그린다
  }
}

export function fontOptions(data: ArrayBuffer | null) {
  return data ? [{ name: "Display", data, style: "normal" as const, weight: 400 as const }] : undefined;
}
