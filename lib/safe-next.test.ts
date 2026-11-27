import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next.ts";

test("사이트 안 경로는 그대로 통과한다", () => {
  assert.equal(safeNext("/topics/abc?x=1#rooms"), "/topics/abc?x=1#rooms");
  assert.equal(safeNext("/"), "/");
});

test("외부로 나가는 주소는 모두 / 로 바꾼다", () => {
  for (const bad of ["//evil.com", "/.//evil.com", "/..//evil.com", "/a/..//evil.com", "/\\evil.com", "\\\\evil.com", "https://evil.com", "javascript:alert(1)", "/\tevil.com", "/%0d%0aSet-Cookie", "", null, undefined]) {
    const out = safeNext(bad as string);
    assert.ok(out === "/" || out.startsWith("/%"), `${JSON.stringify(bad)} → ${out}`);
    assert.ok(!out.startsWith("//"), `${JSON.stringify(bad)} → ${out}`);
  }
});
