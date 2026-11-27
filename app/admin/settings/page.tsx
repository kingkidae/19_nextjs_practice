import { getSettings, SETTING_FIELDS } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettings() {
  const settings = await getSettings();
  return (
    <section aria-labelledby="settings-h" className="max-w-2xl">
      <h2 id="settings-h" className="font-display text-3xl">사이트 설정</h2>
      <p className="mt-1 text-sm text-ink-soft">
        푸터 링크와 검색엔진에 알릴 대표 주소를 정합니다. 저장하면 바로 반영됩니다.
      </p>
      <SettingsForm fields={SETTING_FIELDS.map((f) => ({ ...f }))} values={settings} />
    </section>
  );
}
