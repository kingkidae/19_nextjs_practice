# The Controversial: Pros and Cons

부먹 찍먹부터 낙태 합법화까지, 논쟁 주제를 찬반으로 나눠 실시간으로 토론하는 웹앱. Next.js 16 + Supabase 포트폴리오 프로젝트.

## 기능

- 주제 올리기(사진, 경중 1~10), 9개 카테고리, 검색·상세검색, 볼륨 미터 모양의 경중 필터
- 토론방: 찬반 선택, 동전 룰렛으로 선공 결정, 무작위 발언자, 1~5분 발언 시간, 전체 채팅과 팀 채팅, 팀장 강퇴
- 아이템: 잠깐!!! (상대 발언 중 3분 끼어들기, 발언당 1회) / 방.해.금.지 (잠깐!!! 무효화, 발언당 1회). 토스페이먼츠 테스트 결제
- 빅카인즈 자료 벤토 그리드: 보도량 추이, 연관어, 관계도, 관련 기사(제목·언론사·링크만)
- 관리자: 공지 CRUD, 방 발언 정지·삭제, 메시지 삭제, 강퇴, 주제 삭제, 회원 등급 변경, 빅카인즈 엑셀 업로드
- 이메일 가입·로그인, 구글 로그인

토론 규칙(발언 순서, 타이머, 아이템 판정)은 모두 Postgres 함수가 DB 시간 기준으로 처리한다. 브라우저는 화면만 그린다.

## 처음 설정

### 1. Supabase 프로젝트

1. supabase.com 에서 새 프로젝트를 만든다.
2. SQL Editor 에서 아래 순서로 실행한다.
   1. `supabase/schema.sql` (테이블, 토론 엔진)
   2. `supabase/grants.sql` (테이블 접근 권한)
   3. `supabase/patch-02-profile-settings.sql` (프로필·개인정보·사이트 설정)
   4. `supabase/patch-03-bundle-order.sql` (잠깐!!!·방.해.금.지 묶음 구매)
   5. `supabase/seed.sql` (시연용 주제 14개와 예시 통계)

   `patch-01-roulette-4s.sql` 은 이미 schema.sql 에 반영돼 있어서, 이전 버전 DB 를 쓰던 경우에만 실행한다.
3. Project Settings > API Keys 에서 URL, Publishable key, Secret key 를 복사한다.

### 2. 환경 변수

`.env.example` 을 `.env.local` 로 복사하고 값을 채운다. 토스 키는 문서에 공개된 테스트 키가 미리 들어 있다.

### 3. 구글 로그인

1. Google Cloud Console > API 및 서비스 > 사용자 인증 정보에서 OAuth 클라이언트 ID(웹 애플리케이션)를 만든다.
2. 승인된 리디렉션 URI 에 `https://<프로젝트>.supabase.co/auth/v1/callback` 을 넣는다.
3. Supabase > Authentication > Sign In / Providers > Google 을 켜고 클라이언트 ID 와 보안 비밀을 넣는다.
4. Supabase > Authentication > URL Configuration 의 Redirect URLs 에 `http://localhost:3000/auth/callback` (배포 후에는 배포 주소도) 을 추가한다.

### 4. 관리자 지정

사이트에서 한 번 가입한 뒤 SQL Editor 에서 실행한다.

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '내 이메일');
```

이후 다른 회원의 등급은 관리자 페이지 > 회원 에서 바꿀 수 있다.

### 5. 사이트 설정

관리자 페이지 > 사이트 설정에서 배포 주소(site_url), 이용약관·개인정보 처리방침 링크, 문의 메일, SNS 주소를 정한다. site_url 은 sitemap.xml, robots.txt, 검색엔진 대표 주소, 공유 이미지에 쓰인다.

### 6. 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 빅카인즈 엑셀 파서 테스트
```

## 빅카인즈 자료 넣기

빅카인즈는 공개 API 가 확인되지 않았고 기사 전재를 금지한다. 그래서 관리자가 bigkinds.or.kr 에서 엑셀을 내려받아 관리자 페이지 > 빅카인즈 자료 에서 올리는 방식이다. 기사는 제목·언론사·날짜·원문 링크만 저장한다.

열 이름은 빅카인즈 양식을 추정해 찾는다(`lib/bigkinds.ts` 의 `CANDIDATES`). 업로드가 "열을 찾지 못했습니다" 로 실패하면 오류에 나온 머리글을 보고 후보 목록에 열 이름을 추가한다.

## 구조

```
supabase/schema.sql   테이블, RLS, 토론 엔진 함수, 결제 함수, Realtime, Storage
supabase/seed.sql     시연용 데이터
app/                  페이지 (rooms/[id]/RoomClient.tsx 가 실시간 토론방)
components/           Coin(three.js), TopicCard, FilterPanel, StatsBento
lib/                  Supabase 클라이언트, 상수, 빅카인즈 파서
proxy.ts              세션 쿠키 갱신 (Next.js 16 의 middleware)
app/sitemap.ts, robots.ts, llms.txt, opengraph-image   검색엔진·AI 검색(GEO)용
```
