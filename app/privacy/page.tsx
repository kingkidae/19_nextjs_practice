import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getSettings, SITE } from "@/lib/settings";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: `${SITE.fullName}가 수집하는 개인정보 항목, 이용 목적, 보유 기간, 처리 위탁과 정보주체의 권리.`,
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const { contact_email } = await getSettings();
  const contact = contact_email ? <a href={`mailto:${contact_email}`} className="font-bold underline">{contact_email}</a> : "관리자 페이지 > 사이트 설정에 등록된 문의 메일";

  const sections = [
    {
      id: "items",
      title: "수집하는 개인정보",
      body: (
        <table>
          <thead>
            <tr><th>구분</th><th>항목</th><th>수집 시점</th></tr>
          </thead>
          <tbody>
            <tr><td>필수</td><td>이메일, 비밀번호(암호화 저장) 또는 Google 계정 식별자, 닉네임</td><td>회원 가입</td></tr>
            <tr><td>선택 (공개)</td><td>아바타 사진, 한 줄 소개</td><td>프로필 작성</td></tr>
            <tr><td>선택 (비공개)</td><td>출생연도, 성별, 지역, 관심 카테고리</td><td>프로필 작성</td></tr>
            <tr><td>서비스 이용</td><td>작성한 주제·채팅, 토론 참여 기록, 투표, 아이템 보유 수량</td><td>이용 중</td></tr>
            <tr><td>결제</td><td>주문번호, 결제 금액, 결제 키 (카드번호 등은 토스페이먼츠가 직접 처리하며 서비스는 저장하지 않음)</td><td>아이템 구매</td></tr>
            <tr><td>자동 수집</td><td>로그인 유지용 쿠키, 접속 기록</td><td>접속</td></tr>
          </tbody>
        </table>
      ),
    },
    {
      id: "purpose",
      title: "이용 목적",
      body: (
        <ul>
          <li>회원 식별, 로그인 유지, 부정 이용 방지</li>
          <li>토론방 운영(진영·발언자·팀장 판정, 강퇴 기록)</li>
          <li>아이템 결제 확인과 지급</li>
          <li>관심 카테고리 기반 주제 추천 (비공개 선택 항목)</li>
          <li>공지 전달과 문의 응대</li>
        </ul>
      ),
    },
    {
      id: "retention",
      title: "보유 및 이용 기간",
      body: (
        <>
          <p>회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 아래 정보는 정해진 기간 동안 보관합니다.</p>
          <ul>
            <li>대금 결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>접속 기록: 3개월 (통신비밀보호법)</li>
          </ul>
        </>
      ),
    },
    {
      id: "third-party",
      title: "제3자 제공",
      body: <p>서비스는 정보주체의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 법령에 근거한 수사기관의 요청은 예외로 합니다.</p>,
    },
    {
      id: "outsourcing",
      title: "처리 위탁과 국외 이전",
      body: (
        <table>
          <thead>
            <tr><th>수탁자</th><th>위탁 업무</th><th>이전 국가</th></tr>
          </thead>
          <tbody>
            <tr><td>Supabase Inc.</td><td>회원 인증, 데이터베이스·파일 저장</td><td>프로젝트 리전 소재국 (해외)</td></tr>
            <tr><td>Google LLC</td><td>Google 계정 로그인</td><td>미국</td></tr>
            <tr><td>(주)비바리퍼블리카 (토스페이먼츠)</td><td>결제 처리</td><td>대한민국</td></tr>
          </tbody>
        </table>
      ),
    },
    {
      id: "rights",
      title: "정보주체의 권리",
      body: (
        <p>회원은 언제든지 내 프로필 페이지에서 정보를 조회·수정할 수 있고, 아래 연락처로 열람·정정·삭제·처리정지·탈퇴를 요청할 수 있습니다. 요청은 지체 없이 처리합니다.</p>
      ),
    },
    {
      id: "destruction",
      title: "파기 절차와 방법",
      body: <p>보유 기간이 끝나거나 처리 목적을 달성한 정보는 지체 없이 파기합니다. 전자 파일은 복구할 수 없는 방법으로 삭제합니다.</p>,
    },
    {
      id: "security",
      title: "안전성 확보 조치",
      body: (
        <ul>
          <li>비밀번호 암호화 저장, 전 구간 HTTPS 전송</li>
          <li>행 단위 접근 제어(RLS): 비공개 개인정보는 본인만 읽을 수 있음</li>
          <li>관리자 권한 분리, 결제 지급은 서버 전용 키로만 처리</li>
        </ul>
      ),
    },
    {
      id: "cookies",
      title: "쿠키",
      body: <p>로그인 상태를 유지하기 위한 쿠키만 씁니다. 광고·추적 쿠키는 쓰지 않습니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 그 경우 로그인이 필요한 기능을 쓸 수 없습니다.</p>,
    },
    {
      id: "officer",
      title: "개인정보 보호책임자",
      body: <p>개인정보 관련 문의, 불만 처리, 피해 구제는 {contact} 로 연락해 주세요. 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118)에도 신고할 수 있습니다.</p>,
    },
  ];

  return (
    <LegalPage
      title="개인정보 처리방침"
      effective="2026년 11월 27일"
      intro={<p>{SITE.fullName}는 「개인정보 보호법」에 따라 정보주체의 개인정보를 보호하고, 관련 고충을 신속하게 처리하기 위해 다음과 같이 처리방침을 둡니다.</p>}
      sections={sections}
    />
  );
}
