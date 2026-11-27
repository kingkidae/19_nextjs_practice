-- 시연용 샘플 데이터. schema.sql 실행 후 SQL Editor 에서 실행한다.
-- 통계/기사는 빅카인즈 엑셀 형식을 흉내 낸 예시 값이다(is_sample = true). 실제 자료는 관리자 페이지에서 엑셀로 올린다.

insert into public.topics (id, title, description, category, weight, pros_label, cons_label, created_at, last_chat_at) values
('00000000-0000-0000-0000-000000000001', '탕수육은 부어 먹어야 한다', '소스를 붓는 순간 바삭함은 끝난다는 쪽과, 소스가 스며들어야 완성된다는 쪽. 중국집 테이블의 오랜 전쟁.', 'culture', 1, '부먹', '찍먹', now() - interval '9 days', now() - interval '4 minutes'),
('00000000-0000-0000-0000-000000000002', '민트초코는 음식이다', '치약 맛이라는 혐오와 상쾌한 단맛이라는 사랑 사이.', 'culture', 1, '민초파', '반민초파', now() - interval '6 days', now() - interval '2 hours'),
('00000000-0000-0000-0000-000000000003', '낙태는 전면 합법화되어야 한다', '헌법불합치 결정 이후 입법 공백이 이어지고 있다. 여성의 자기결정권과 태아의 생명권은 어디서 만나야 하는가.', 'society', 10, '찬성', '반대', now() - interval '3 days', now() - interval '11 minutes'),
('00000000-0000-0000-0000-000000000004', '최저임금을 1만 2천 원 이상으로 올려야 한다', '생활임금 보장과 자영업자 부담, 고용 감소 우려가 맞선다.', 'economy', 7, '인상', '동결', now() - interval '5 days', now() - interval '1 day'),
('00000000-0000-0000-0000-000000000005', '국회의원 정수를 줄여야 한다', '세비 절감과 대표성 약화 사이의 오래된 논쟁.', 'politics', 8, '축소', '유지', now() - interval '2 days', now() - interval '35 minutes'),
('00000000-0000-0000-0000-000000000006', '생성형 AI 학습에 저작권료를 내야 한다', '창작자의 권리 보호와 기술 발전 속도, 누구의 손을 들어줄 것인가.', 'tech', 6, '지불해야', '자유 학습', now() - interval '4 days', now() - interval '3 hours'),
('00000000-0000-0000-0000-000000000007', '프로야구에 로봇 심판을 전면 도입해야 한다', 'ABS 도입 이후 판정 시비는 줄었지만 야구의 맛은?', 'sports', 3, '전면 도입', '사람 심판', now() - interval '8 days', now() - interval '6 hours'),
('00000000-0000-0000-0000-000000000008', '아이돌 연애는 팬에 대한 배신이다', '사생활의 자유와 팬덤 비즈니스의 계약 사이.', 'entertainment', 4, '배신이다', '자유다', now() - interval '1 day', now() - interval '20 minutes'),
('00000000-0000-0000-0000-000000000009', '한국은 핵무장을 해야 한다', '북핵 고도화와 동맹 신뢰 문제, 그리고 국제 제재의 대가.', 'world', 9, '찬성', '반대', now() - interval '7 days', now() - interval '2 days'),
('00000000-0000-0000-0000-000000000010', '지하철 노약자석은 비어 있으면 앉아도 된다', '빈자리는 빈자리라는 쪽과 배려석은 비워 두는 것이 원칙이라는 쪽.', 'local', 2, '앉아도 된다', '비워 둬야', now() - interval '10 days', now() - interval '5 hours'),
('00000000-0000-0000-0000-000000000011', '의대 정원은 계속 늘려야 한다', '지역 의료 공백과 교육 여건, 필수의료 인력 사이의 줄다리기.', 'society', 8, '확대', '조정', now() - interval '12 days', now() - interval '9 hours'),
('00000000-0000-0000-0000-000000000012', '수도권 집값을 잡으려면 보유세를 올려야 한다', '투기 억제 효과와 실수요자 부담, 조세 저항.', 'economy', 7, '인상', '반대', now() - interval '11 days', null),
('00000000-0000-0000-0000-000000000013', '깻잎 논쟁: 애인이 남의 깻잎을 떼 줘도 된다', '친절인가 선 넘기인가. 연애 예능이 쏘아 올린 질문.', 'culture', 1, '괜찮다', '안 된다', now() - interval '13 days', now() - interval '1 hour'),
('00000000-0000-0000-0000-000000000014', '청소년 SNS 이용을 법으로 제한해야 한다', '호주의 16세 미만 SNS 금지법 이후 한국도 논의가 시작됐다.', 'tech', 6, '제한', '자율', now() - interval '2 days', now() - interval '50 minutes');

insert into public.topic_stats (topic_id, is_sample, trend, keywords, relations, articles) values
('00000000-0000-0000-0000-000000000003', true,
 '[{"date":"2026-06","count":182},{"date":"2026-07","count":240},{"date":"2026-08","count":198},{"date":"2026-09","count":321},{"date":"2026-10","count":410},{"date":"2026-11","count":377}]',
 '[{"word":"헌법불합치","weight":98},{"word":"자기결정권","weight":91},{"word":"입법 공백","weight":84},{"word":"생명권","weight":80},{"word":"모자보건법","weight":66},{"word":"임신중지 약물","weight":61},{"word":"종교계","weight":44},{"word":"여성단체","weight":42},{"word":"국회 법사위","weight":35},{"word":"상담 의무","weight":28}]',
 '[{"name":"헌법재판소","type":"기관","weight":90},{"name":"보건복지부","type":"기관","weight":74},{"name":"국회","type":"기관","weight":70},{"name":"여성단체","type":"단체","weight":58},{"name":"천주교","type":"단체","weight":52},{"name":"대한산부인과의사회","type":"단체","weight":47},{"name":"미국 연방대법원","type":"기관","weight":33}]',
 '[{"title":"낙태죄 헌법불합치 이후 입법 공백 장기화…현장은 혼란","press":"예시일보","date":"2026-11-21","url":"https://www.bigkinds.or.kr/"},{"title":"임신중지 약물 도입 논의 다시 수면 위로","press":"샘플신문","date":"2026-11-14","url":"https://www.bigkinds.or.kr/"},{"title":"종교계 \"생명 존중 원칙 지켜야\" 성명","press":"예시경제","date":"2026-11-03","url":"https://www.bigkinds.or.kr/"},{"title":"여성단체 \"자기결정권 보장하는 입법 서둘러야\"","press":"샘플방송","date":"2026-10-28","url":"https://www.bigkinds.or.kr/"}]'),
('00000000-0000-0000-0000-000000000001', true,
 '[{"date":"2026-06","count":12},{"date":"2026-07","count":9},{"date":"2026-08","count":31},{"date":"2026-09","count":18},{"date":"2026-10","count":22},{"date":"2026-11","count":27}]',
 '[{"word":"바삭함","weight":95},{"word":"소스","weight":90},{"word":"중국집","weight":72},{"word":"배달","weight":60},{"word":"눅눅","weight":55},{"word":"찹쌀 탕수육","weight":41},{"word":"꿔바로우","weight":38},{"word":"밸런스 게임","weight":30}]',
 '[{"name":"배달앱","type":"기업","weight":60},{"name":"중식 셰프","type":"인물","weight":48},{"name":"예능 프로그램","type":"미디어","weight":40}]',
 '[{"title":"부먹이냐 찍먹이냐…배달앱 주문 데이터로 본 탕수육 취향","press":"예시일보","date":"2026-11-10","url":"https://www.bigkinds.or.kr/"},{"title":"셰프들이 말하는 탕수육 소스의 과학","press":"샘플매거진","date":"2026-09-02","url":"https://www.bigkinds.or.kr/"}]'),
('00000000-0000-0000-0000-000000000004', true,
 '[{"date":"2026-06","count":402},{"date":"2026-07","count":655},{"date":"2026-08","count":210},{"date":"2026-09","count":180},{"date":"2026-10","count":233},{"date":"2026-11","count":290}]',
 '[{"word":"최저임금위원회","weight":97},{"word":"소상공인","weight":88},{"word":"고용 감소","weight":75},{"word":"생활임금","weight":70},{"word":"물가","weight":66},{"word":"업종별 차등","weight":58},{"word":"키오스크","weight":40}]',
 '[{"name":"최저임금위원회","type":"기관","weight":92},{"name":"민주노총","type":"단체","weight":70},{"name":"소상공인연합회","type":"단체","weight":68},{"name":"고용노동부","type":"기관","weight":61},{"name":"한국은행","type":"기관","weight":30}]',
 '[{"title":"내년 최저임금 결정 앞두고 노사 격돌","press":"예시경제","date":"2026-07-08","url":"https://www.bigkinds.or.kr/"},{"title":"업종별 차등 적용 다시 부결","press":"샘플신문","date":"2026-07-02","url":"https://www.bigkinds.or.kr/"},{"title":"편의점 점주들 \"야간 영업 줄일 수밖에\"","press":"예시일보","date":"2026-06-25","url":"https://www.bigkinds.or.kr/"}]'),
('00000000-0000-0000-0000-000000000006', true,
 '[{"date":"2026-06","count":140},{"date":"2026-07","count":188},{"date":"2026-08","count":230},{"date":"2026-09","count":260},{"date":"2026-10","count":305},{"date":"2026-11","count":344}]',
 '[{"word":"저작권","weight":99},{"word":"학습 데이터","weight":90},{"word":"창작자","weight":81},{"word":"공정 이용","weight":73},{"word":"AI 기본법","weight":64},{"word":"라이선스","weight":52},{"word":"웹툰","weight":40}]',
 '[{"name":"문화체육관광부","type":"기관","weight":66},{"name":"한국저작권위원회","type":"기관","weight":63},{"name":"OpenAI","type":"기업","weight":60},{"name":"네이버","type":"기업","weight":55},{"name":"한국웹툰작가협회","type":"단체","weight":44}]',
 '[{"title":"AI 학습 데이터 보상 기준 마련 착수","press":"샘플신문","date":"2026-11-18","url":"https://www.bigkinds.or.kr/"},{"title":"웹툰 작가들 \"무단 학습 멈춰라\"","press":"예시일보","date":"2026-10-30","url":"https://www.bigkinds.or.kr/"}]');

insert into public.notices (title, body, pinned) values
('The Controversial 오픈 안내', E'싸움은 화끈하게, 말은 품위 있게.\n욕설·혐오 표현·개인정보 노출은 관리자 판단으로 즉시 삭제되고 강퇴될 수 있습니다.', true),
('결제는 테스트 모드입니다', '상점의 잠깐!!! / 방.해.금.지 결제는 토스페이먼츠 테스트 환경이라 실제 돈이 나가지 않습니다.', false);
