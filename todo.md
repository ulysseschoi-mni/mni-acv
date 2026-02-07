# MNI ACV Project TODO

## Phase 1: 프로젝트 계획 수립
- [x] 프로젝트 초기화 완료
- [x] TODO 파일 작성

## Phase 2: 이미지 에셋 준비
- [x] 기존 리포지터리 이미지 파일 S3 업로드
- [x] CDN URL 확보 및 매핑

## Phase 3: 글로벌 스타일 및 폰트 설정
- [x] Google Fonts 연동 (Nanum Pen Script, Permanent Marker, Courier Prime)
- [x] Tailwind 커스텀 컬러 설정 (brand-black, brand-white, brand-periwinkle)
- [x] 커스텀 폰트 패밀리 설정
- [x] 글로벌 CSS 애니메이션 정의

## Phase 4: 스플래시 스크린 및 네비게이션
- [x] 스플래시 스크린 인트로 시퀀스 구현 (mee → mni acv → 최종 타이틀)
- [x] Start 버튼 및 사이트 진입 애니메이션
- [x] 고정 네비게이션 헤더 구현
- [x] 모바일 햄버거 메뉴 구현
- [x] SPA 라우팅 로직 구현

## Phase 5: HOME 섹션
- [x] 히어로 블록 (포스트잇 스타일 mni acv 로고)
- [x] 스토리텔링 블록 1 (blue_pants_sketch 이미지)
- [x] 스토리텔링 블록 2 (tshirt_sketch 이미지)
- [x] 네비게이션 링크 블록 (THE DROPS, THE ROOM)
- [x] 애니메이션 효과 (bounce arrow, hover effects)

## Phase 6: ROOM 섹션
- [x] 갤러리 그리드 레이아웃 (2x2 또는 4열)
- [x] 4개 이미지 카드 구현 (room_1~4.jpg)
- [x] 이미지 모달 확대 기능
- [x] 모달 닫기 기능

## Phase 7: DROPS 섹션
- [x] 카운트다운 타이머 구현 (3일 후 기준)
- [x] 제품 카드 1: TOILET PAPER TEE ($80)
- [x] 제품 카드 2: STICK HOODIE ($120)
- [x] PRE-ORDER 버튼 UI

## Phase 8: SIGN IN 섹션
- [x] 회원가입 폼 레이아웃
- [x] CODENAME 입력 필드
- [x] SECRET KEY 입력 필드
- [x] ACCESS 버튼
- [x] 향후 인증 시스템 연동 준비

## Phase 9: 모바일 반응형 및 애니메이션
- [x] 모바일 반응형 레이아웃 점검
- [x] 페이지 전환 애니메이션 (slide-up)
- [x] 호버 효과 및 트랜지션 점검
- [x] Footer 구현

## Phase 10: 테스트 및 배포
- [x] 전체 기능 테스트
- [x] 브라우저 호환성 점검
- [x] 체크포인트 생성

## Phase 11: Phase 1 - 데이터베이스 마이그레이션 (완료)
- [x] 주문 관련 테이블 생성 (Orders, OrderItems, Shipments)
- [x] 상품 및 Drop 테이블 생성 (Products, Drops, DropProducts)
- [x] 멤버십 테이블 생성 (MembershipPlans, UserMemberships, MembershipPayments)
- [x] 초기 데이터 입력 (상품, Drop, 멤버십 플랜)
- [x] Drizzle ORM 스키마 업데이트
- [x] 데이터베이스 마이그레이션 검증

## Phase 12: Phase 2 - 백엔드 API 구현 (예정)
- [ ] 상품 조회 API (tRPC)
- [ ] 주문 생성/조회 API (tRPC)
- [ ] 멤버십 관리 API (tRPC)
- [ ] API 테스트

## Phase 13: Phase 2 - 백엔드 API 구현 (완료)
- [x] 데이터베이스 헬퍼 함수 구현 (상품, Drop 조회)
- [x] 상품 조회 tRPC 라우터 구현 (list, getById, getByCategory)
- [x] Drop 조회 tRPC 라우터 구현 (getCurrent, getNext, getById, getProducts, getByStatus, getCurrentCountdown)
- [x] 상품 API 테스트 작성 (5개 테스트 통과)
- [x] Drop API 테스트 작성 (8개 테스트 통과)
- [x] 모든 테스트 검증 완료 (14개 테스트 통과)

## Phase 14: Phase 3 - 프론트엔드 페이지 개발 (완료)
- [x] 상품 상세 페이지 구현 (ProductDetail.tsx)
  - 상품 이미지, 설명, 가격 표시
  - 수량 선택 기능
  - 장바구니/바로 구매 버튼
  - 재고 상태 표시
- [x] Drop 페이지 구현 (Drops.tsx)
  - 현재 진행 중인 Drop 정보 표시
  - 실시간 카운트다운 타이머 (일/시/분/초)
  - Drop 내 상품 목록 및 한정 수량 진행률
  - 상품 상세 페이지 링크
- [x] 라우팅 및 네비게이션 업데이트
  - App.tsx에 ProductDetail, Drops 라우트 추가
  - Home.tsx에서 Drops 페이지로의 네비게이션 링크 추가
  - wouter 기반 SPA 라우팅 구현
