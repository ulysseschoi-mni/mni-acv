# MNI ACV 프로젝트 개발 상황 분석

**작성일**: 2026-02-07  
**현재 상태**: Phase 3 완료 (프론트엔드 기본 페이지)  
**다음 단계**: Phase 4 (주문 및 결제 시스템)

---

## 📊 현재까지의 개발 진행 상황

### 완료된 작업 (Phase 1-3)

#### Phase 1: 프론트엔드 기본 구조 ✅
- 스플래시 스크린 인트로 시퀀스
- SPA 네비게이션 (HOME, ROOM, DROPS, SIGN IN)
- 반응형 모바일 레이아웃
- Courier Prime 폰트 기본 적용
- 모든 텍스트 영어화

**완성도**: 100% - 사용자 인터페이스 완성

#### Phase 2: 데이터베이스 설계 ✅
- 10개 테이블 생성 (users, products, drops, orders, etc.)
- Drizzle ORM 스키마 정의
- 초기 데이터 입력 (상품 2개, Drop 1개, 멤버십 플랜 3개)
- Foreign Key 제약 조건 추가
- 인덱스 최적화

**완성도**: 100% - 데이터베이스 기본 구조 완성

#### Phase 3: 백엔드 API 구현 ✅
- 상품 조회 API (list, getById, getByCategory)
- Drop 조회 API (getCurrent, getNext, getProducts, countdown)
- 데이터베이스 헬퍼 함수
- 14개 테스트 작성 및 통과
- 에러 처리 기본 구현

**완성도**: 100% - 상품/Drop 관련 API 완성

#### Phase 4: 프론트엔드 페이지 구현 ✅
- 상품 상세 페이지 (ProductDetail.tsx)
- Drop 전용 페이지 (Drops.tsx)
- 라우팅 및 네비게이션 통합
- 실시간 카운트다운 타이머
- 수량 선택 UI

**완성도**: 100% - 상품/Drop 페이지 완성

#### 추가 작업 ✅
- GitHub 자동 동기화 설정 (Git hooks)
- 코드 리뷰 보고서 작성
- fullstack-ecommerce-builder 스킬 생성

---

## 🎯 현재 상태 요약

### 개발 완료 항목

| 영역 | 상태 | 설명 |
|------|------|------|
| **프론트엔드** | ✅ 완료 | 스플래시, 네비게이션, 상품/Drop 페이지 |
| **데이터베이스** | ✅ 완료 | 10개 테이블, 초기 데이터 |
| **상품/Drop API** | ✅ 완료 | 조회 기능, 14개 테스트 통과 |
| **Git 자동화** | ✅ 완료 | GitHub 자동 동기화 설정 |
| **코드 품질** | ✅ 완료 | 코드 리뷰, 스킬 생성 |

### 개발 미완료 항목

| 영역 | 상태 | 설명 |
|------|------|------|
| **주문 API** | ⏳ 예정 | 주문 생성, 조회, 상태 업데이트 |
| **장바구니** | ⏳ 예정 | 상태 관리, 로컬 스토리지 |
| **결제 시스템** | ⏳ 예정 | 토스페이먼츠 통합 |
| **멤버십 API** | ⏳ 예정 | 구독, 취소, 정기결제 |
| **관리자 대시보드** | ⏳ 예정 | 주문/매출/회원 관리 |
| **회원가입/로그인** | ⏳ 예정 | Manus OAuth + 소셜 로그인 |

---

## 🚀 다음 단계: Phase 4-6 로드맵

### Phase 4: 주문 및 결제 시스템 (3-4주)

#### 4-1: 주문 API 구현 (1주)
```typescript
// server/routers/orders.ts
orders: {
  create: protectedProcedure
    .input(/* order schema */)
    .mutation(/* 주문 생성 로직 */),
  
  getById: protectedProcedure
    .input(z.number())
    .query(/* 주문 조회 */),
  
  getUserOrders: protectedProcedure
    .query(/* 사용자 주문 이력 */),
  
  updateStatus: adminProcedure
    .input(/* status update */)
    .mutation(/* 상태 업데이트 */),
  
  cancel: protectedProcedure
    .input(z.number())
    .mutation(/* 주문 취소 */),
}
```

**필요한 작업:**
- [ ] 주문 생성 API 구현
- [ ] 주문 조회 API 구현
- [ ] 주문 상태 업데이트 API
- [ ] 주문 취소 API
- [ ] 주문 API 테스트 (8-10개)

**예상 기간**: 3-4일

#### 4-2: 장바구니 시스템 (1주)
```typescript
// client/src/contexts/CartContext.tsx
// Zustand 또는 Context API로 장바구니 상태 관리
interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  total: () => number;
}
```

**필요한 작업:**
- [ ] Zustand 또는 Context API 선택
- [ ] 장바구니 상태 관리 구현
- [ ] 로컬 스토리지 동기화
- [ ] 장바구니 페이지 UI
- [ ] 장바구니 테스트

**예상 기간**: 3-4일

#### 4-3: 토스페이먼츠 결제 통합 (1.5주)
```typescript
// server/routers/payments.ts
payments: {
  initiatePayment: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      amount: z.number(),
    }))
    .mutation(/* 결제 시작 */),
  
  confirmPayment: publicProcedure
    .input(z.object({
      orderId: z.number(),
      paymentKey: z.string(),
      amount: z.number(),
    }))
    .mutation(/* 결제 확인 */),
  
  handleWebhook: publicProcedure
    .input(z.any())
    .mutation(/* 웹훅 처리 */),
}
```

**필요한 작업:**
- [ ] 토스페이먼츠 API 키 설정
- [ ] 결제 페이지 UI 구현
- [ ] 결제 초기화 API
- [ ] 결제 확인 API
- [ ] 웹훅 처리 로직
- [ ] 결제 테스트 (샌드박스)

**예상 기간**: 5-7일

### Phase 5: 회원가입 및 인증 강화 (2-3주)

#### 5-1: 회원가입 페이지 (1주)
```typescript
// client/src/pages/SignUp.tsx
// SIGN IN 섹션을 실제 회원가입 폼으로 변환
interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  agreeToTerms: boolean;
}
```

**필요한 작업:**
- [ ] 회원가입 폼 UI 개선
- [ ] 입력 검증 (이메일, 비밀번호)
- [ ] 회원가입 API 구현
- [ ] 이메일 인증 (선택사항)
- [ ] 회원가입 테스트

**예상 기간**: 3-4일

#### 5-2: 소셜 로그인 추가 (1주)
```typescript
// server/routers/auth.ts
auth: {
  // 기존
  me: publicProcedure.query(...),
  logout: publicProcedure.mutation(...),
  
  // 추가
  kakaoLogin: publicProcedure.query(...),
  naverLogin: publicProcedure.query(...),
  googleLogin: publicProcedure.query(...),
}
```

**필요한 작업:**
- [ ] 카카오 로그인 API 연동
- [ ] 네이버 로그인 API 연동
- [ ] 구글 로그인 API 연동 (선택사항)
- [ ] 소셜 로그인 UI
- [ ] 소셜 로그인 테스트

**예상 기간**: 3-4일

#### 5-3: 사용자 프로필 관리 (1주)
```typescript
// client/src/pages/Profile.tsx
// 사용자 정보 조회/수정
interface UserProfile {
  id: number;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}
```

**필요한 작업:**
- [ ] 프로필 페이지 UI
- [ ] 프로필 조회 API
- [ ] 프로필 수정 API
- [ ] 비밀번호 변경 API
- [ ] 계정 삭제 API

**예상 기간**: 3-4일

### Phase 6: 멤버십 및 관리자 대시보드 (2-3주)

#### 6-1: 멤버십 페이지 (1주)
```typescript
// client/src/pages/Membership.tsx
// 멤버십 플랜 비교 및 구독
interface MembershipPlan {
  id: number;
  name: string;
  price: number; // 월간
  benefits: string[];
  status: 'active' | 'inactive';
}
```

**필요한 작업:**
- [ ] 멤버십 플랜 비교 UI
- [ ] 멤버십 구독 API
- [ ] 멤버십 취소 API
- [ ] 정기결제 설정
- [ ] 멤버십 테스트

**예상 기간**: 3-4일

#### 6-2: 관리자 대시보드 (1.5주)
```typescript
// client/src/pages/admin/Dashboard.tsx
// 주문, 매출, 회원 관리
interface AdminDashboard {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  recentOrders: Order[];
  salesChart: ChartData;
}
```

**필요한 작업:**
- [ ] 대시보드 레이아웃
- [ ] 주문 관리 페이지
- [ ] 매출 통계 및 차트
- [ ] 회원 관리 페이지
- [ ] 상품 관리 페이지
- [ ] 관리자 권한 검증

**예상 기간**: 5-7일

---

## 📈 개발 일정 추정

| Phase | 작업 | 기간 | 시작 | 종료 |
|-------|------|------|------|------|
| 1-3 | 프론트/백엔드 기본 | ✅ 완료 | 2/1 | 2/7 |
| 4-1 | 주문 API | 1주 | 2/8 | 2/14 |
| 4-2 | 장바구니 | 1주 | 2/15 | 2/21 |
| 4-3 | 결제 시스템 | 1.5주 | 2/22 | 3/7 |
| 5-1 | 회원가입 | 1주 | 3/8 | 3/14 |
| 5-2 | 소셜 로그인 | 1주 | 3/15 | 3/21 |
| 5-3 | 프로필 관리 | 1주 | 3/22 | 3/28 |
| 6-1 | 멤버십 | 1주 | 3/29 | 4/4 |
| 6-2 | 관리자 대시보드 | 1.5주 | 4/5 | 4/18 |
| **총 기간** | | **9주** | 2/8 | 4/18 |

---

## 🔧 필수 준비 사항

### 사업자 등록 (병렬 진행)
- [ ] 사업자등록증 준비 (개인/법인)
- [ ] 세무사 상담 (세금 신고 구조)
- [ ] 법무사 검토 (약관, 개인정보보호)

### 결제 시스템
- [ ] 토스페이먼츠 가입
- [ ] API 키 발급
- [ ] 샌드박스 테스트
- [ ] 본격 운영 전환

### 배송 파트너
- [ ] CJ/로젠/우체국 계약
- [ ] 배송 API 연동
- [ ] 배송 추적 시스템

---

## 💡 개발 전략

### 우선순위 순서
1. **Phase 4-1: 주문 API** - 가장 핵심 기능
2. **Phase 4-2: 장바구니** - 사용자 경험 필수
3. **Phase 4-3: 결제** - 실제 판매 가능
4. **Phase 5: 인증** - 회원 관리 필수
5. **Phase 6: 멤버십/대시보드** - 운영 효율화

### 병렬 진행 가능 항목
- 사업자 등록 (개발과 동시 진행)
- 세무사/법무사 상담 (개발과 동시 진행)
- 배송 파트너 계약 (Phase 4 진행 중)

### 테스트 전략
- 각 API 완성 후 즉시 단위 테스트 작성
- Phase 4 완료 후 통합 테스트
- Phase 5 완료 후 사용자 인수 테스트
- Phase 6 완료 후 성능 테스트

---

## 🎯 성공 기준

### Phase 4 완료 시
- ✅ 상품을 장바구니에 추가 가능
- ✅ 장바구니에서 주문 생성 가능
- ✅ 토스페이먼츠로 결제 가능
- ✅ 결제 후 주문 상태 업데이트
- ✅ 사용자가 주문 이력 조회 가능

### Phase 5 완료 시
- ✅ 새로운 사용자 회원가입 가능
- ✅ 카카오/네이버로 로그인 가능
- ✅ 사용자 프로필 수정 가능
- ✅ 비밀번호 변경 가능

### Phase 6 완료 시
- ✅ 멤버십 플랜 구독 가능
- ✅ 정기결제 자동 진행
- ✅ 관리자가 주문 관리 가능
- ✅ 매출 통계 조회 가능

---

## 📞 다음 단계

**지금부터 시작할 작업:**

1. **Phase 4-1 시작**: 주문 API 구현
   ```bash
   # 1. 주문 API 스키마 설계
   # 2. server/routers/orders.ts 작성
   # 3. 테스트 작성
   # 4. GitHub에 푸시 (자동)
   ```

2. **사업자 등록 진행**: 병렬로 진행
   - 사업자등록증 준비
   - 세무사 상담 예약

3. **토스페이먼츠 가입**: Phase 4-3 준비
   - 사업자등록증 필요
   - API 키 발급

---

## 📊 프로젝트 통계

| 항목 | 수치 |
|------|------|
| 완료된 테이블 | 10개 |
| 완료된 API | 6개 (상품/Drop) |
| 완료된 페이지 | 3개 (Home, ProductDetail, Drops) |
| 작성된 테스트 | 14개 |
| 코드 라인 수 | ~2,500줄 |
| GitHub 커밋 | 10+ |

---

**질문이나 추가 지원이 필요하면 언제든지 말씀해주세요!**
