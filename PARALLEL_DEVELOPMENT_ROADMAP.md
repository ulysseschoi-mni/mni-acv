# MNI ACV - 사업자 준비 기간 병렬 개발 로드맵

## 개요

사업자등록증, 세무사/법무사 상담 준비 기간(약 2-4주)은 **개발 관점에서 매우 중요한 시간**입니다. 이 기간 동안 결제 시스템 가입 전에 완료할 수 있는 개발 작업들을 정리했습니다.

---

## 📋 병렬 개발 항목 (우선순위별)

### ✅ Phase 1: 핵심 데이터베이스 설계 (1주일)
**목표**: 결제 시스템 연동 전 데이터 구조 완성

#### 1.1 주문(Orders) 테이블 설계
```sql
-- 주문 정보 저장
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  orderNumber VARCHAR(50) UNIQUE,  -- 주문번호 (예: MNI-20260207-001)
  totalAmount INT NOT NULL,         -- 총액 (원)
  status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
  paymentMethod VARCHAR(50),        -- 결제 수단 (card, transfer, phone)
  paymentKey VARCHAR(255),          -- 토스페이먼츠 결제 키
  orderedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paidAt TIMESTAMP,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 주문 상품 상세
CREATE TABLE orderItems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice INT NOT NULL,
  totalPrice INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id)
);

-- 배송 정보
CREATE TABLE shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL UNIQUE,
  recipientName VARCHAR(100) NOT NULL,
  recipientPhone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  addressDetail VARCHAR(255),
  postalCode VARCHAR(10),
  status ENUM('pending', 'preparing', 'shipped', 'delivered', 'returned') DEFAULT 'pending',
  trackingNumber VARCHAR(50),
  shippingCompany VARCHAR(50),  -- CJ, 로젠, 우체국 등
  shippedAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id)
);
```

**개발 작업**:
- [ ] 위 테이블 생성 SQL 작성
- [ ] `webdev_execute_sql`로 데이터베이스 마이그레이션 실행
- [ ] Drizzle ORM 스키마 업데이트 (`drizzle/schema.ts`)

---

#### 1.2 상품(Products) 테이블 설계
```sql
-- 상품 정보
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,           -- 상품명 (예: TOILET PAPER TEE)
  description TEXT,
  price INT NOT NULL,                   -- 가격 (원)
  imageUrl VARCHAR(255),                -- CDN URL
  category VARCHAR(50),                 -- tee, hoodie 등
  stock INT DEFAULT 0,                  -- 재고
  status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 한정판 Drop 정보
CREATE TABLE drops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,           -- Drop 이름 (예: Archive #1)
  description TEXT,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  status ENUM('upcoming', 'active', 'ended') DEFAULT 'upcoming',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop과 Product 연결
CREATE TABLE dropProducts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dropId INT NOT NULL,
  productId INT NOT NULL,
  limitedQuantity INT,                  -- 한정 수량
  soldQuantity INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dropId) REFERENCES drops(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  UNIQUE KEY (dropId, productId)
);
```

**개발 작업**:
- [ ] 상품 테이블 생성 및 마이그레이션
- [ ] 초기 상품 데이터 입력 (TOILET PAPER TEE, STICK HOODIE)
- [ ] Drop 테이블 설계 및 생성

---

#### 1.3 멤버십(Membership) 테이블 설계
```sql
-- 멤버십 플랜
CREATE TABLE membershipPlans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,            -- Free, Member, VIP
  monthlyPrice INT NOT NULL,            -- 월 가격 (원)
  discountRate DECIMAL(5, 2) DEFAULT 0, -- 할인율 (%)
  freeShipping BOOLEAN DEFAULT FALSE,
  benefits TEXT,                        -- JSON 형식의 혜택 목록
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 멤버십
CREATE TABLE userMemberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  planId INT NOT NULL,
  subscriptionStatus ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  subscriptionId VARCHAR(255),          -- 토스페이먼츠 구독 ID
  startDate TIMESTAMP NOT NULL,
  renewalDate TIMESTAMP NOT NULL,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (planId) REFERENCES membershipPlans(id)
);

-- 멤버십 결제 이력
CREATE TABLE membershipPayments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userMembershipId INT NOT NULL,
  amount INT NOT NULL,
  status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  paymentKey VARCHAR(255),
  paidAt TIMESTAMP,
  failedAt TIMESTAMP,
  failureReason VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userMembershipId) REFERENCES userMemberships(id)
);
```

**개발 작업**:
- [ ] 멤버십 플랜 테이블 생성
- [ ] Free/Member/VIP 플랜 초기 데이터 입력
- [ ] 사용자 멤버십 추적 테이블 생성

---

### ✅ Phase 2: 백엔드 API 설계 (1주일)
**목표**: 결제 시스템 연동 시 바로 사용할 수 있는 API 구조 완성

#### 2.1 주문 관련 tRPC 프로시저
```typescript
// server/routers/orders.ts
export const ordersRouter = router({
  // 주문 생성 (결제 전)
  create: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1)
      })),
      shipmentInfo: z.object({
        recipientName: z.string(),
        recipientPhone: z.string(),
        address: z.string(),
        addressDetail: z.string().optional(),
        postalCode: z.string()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. 주문 생성
      // 2. 주문 상품 추가
      // 3. 배송 정보 저장
      // 4. 주문번호 생성 (MNI-YYYYMMDD-XXX)
      // 5. 결제 준비 상태로 반환
    }),

  // 주문 조회
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      // 주문 + 상품 + 배송 정보 조회
    }),

  // 사용자 주문 목록
  listByUser: protectedProcedure
    .query(async ({ ctx }) => {
      // 사용자의 모든 주문 조회 (최신순)
    }),

  // 주문 취소
  cancel: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      // 주문 상태를 cancelled로 변경
      // 환불 처리 로직 추가 필요
    })
});
```

**개발 작업**:
- [ ] 주문 생성 API 구현
- [ ] 주문 조회 API 구현
- [ ] 주문 목록 API 구현
- [ ] 주문 취소 API 구현 (환불 로직은 결제 시스템 연동 후)

---

#### 2.2 상품 관련 tRPC 프로시저
```typescript
// server/routers/products.ts
export const productsRouter = router({
  // 모든 상품 조회
  list: publicProcedure
    .query(async () => {
      // 활성 상품 목록 반환
    }),

  // 상품 상세 조회
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      // 상품 정보 + 현재 Drop 정보 반환
    }),

  // 현재 진행 중인 Drop 조회
  getCurrentDrop: publicProcedure
    .query(async () => {
      // 현재 활성 Drop 정보 반환
    }),

  // 다음 Drop 정보 조회
  getNextDrop: publicProcedure
    .query(async () => {
      // 예정된 Drop 정보 + 카운트다운 반환
    })
});
```

**개발 작업**:
- [ ] 상품 목록 API 구현
- [ ] 상품 상세 조회 API 구현
- [ ] Drop 정보 API 구현

---

#### 2.3 멤버십 관련 tRPC 프로시저
```typescript
// server/routers/memberships.ts
export const membershipsRouter = router({
  // 멤버십 플랜 목록
  listPlans: publicProcedure
    .query(async () => {
      // 모든 멤버십 플랜 반환
    }),

  // 사용자 현재 멤버십
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      // 사용자의 현재 멤버십 정보 반환
    }),

  // 멤버십 구독 (결제 연동 후)
  subscribe: protectedProcedure
    .input(z.number()) // planId
    .mutation(async ({ ctx, input }) => {
      // 멤버십 구독 시작
    }),

  // 멤버십 취소
  cancel: protectedProcedure
    .mutation(async ({ ctx }) => {
      // 멤버십 취소 처리
    })
});
```

**개발 작업**:
- [ ] 멤버십 플랜 조회 API 구현
- [ ] 사용자 멤버십 조회 API 구현
- [ ] 멤버십 구독/취소 API 구현 (결제 연동 전까지는 상태 변경만)

---

### ✅ Phase 3: 프론트엔드 페이지 구조 (1주일)
**목표**: 결제 페이지, 회원 정보 페이지 UI 준비

#### 3.1 필요한 페이지 목록
```
1. 상품 상세 페이지 (/product/:id)
   - 상품 이미지, 설명, 가격
   - 수량 선택
   - "장바구니 추가" 또는 "바로 구매" 버튼

2. 장바구니 페이지 (/cart)
   - 장바구니 상품 목록
   - 수량 조정
   - 총액 계산
   - "결제하기" 버튼

3. 결제 페이지 (/checkout)
   - 배송 정보 입력 폼
   - 주문 요약
   - 결제 수단 선택 (토스페이먼츠 위젯)
   - "결제하기" 버튼

4. 결제 완료 페이지 (/payment/success)
   - 주문번호 표시
   - 배송 예정일
   - 주문 추적 링크

5. 회원 프로필 페이지 (/profile)
   - 사용자 정보 조회/수정
   - 멤버십 상태 표시
   - 멤버십 변경 버튼

6. 주문 이력 페이지 (/orders)
   - 주문 목록
   - 주문 상태 표시
   - 배송 추적 링크
   - 주문 상세 조회

7. 멤버십 페이지 (/membership)
   - 멤버십 플랜 비교
   - 현재 멤버십 표시
   - "구독하기" / "변경하기" 버튼
```

**개발 작업**:
- [ ] 상품 상세 페이지 UI 구현
- [ ] 장바구니 페이지 UI 구현
- [ ] 결제 페이지 UI 구현 (토스페이먼츠 위젯 통합 전)
- [ ] 결제 완료 페이지 UI 구현
- [ ] 회원 프로필 페이지 UI 구현
- [ ] 주문 이력 페이지 UI 구현
- [ ] 멤버십 페이지 UI 구현

---

#### 3.2 장바구니 상태 관리
```typescript
// client/src/contexts/CartContext.tsx
// 또는 Zustand/Jotai 등 상태 관리 라이브러리 사용

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  total: () => number;
}
```

**개발 작업**:
- [ ] 장바구니 상태 관리 시스템 구현
- [ ] 로컬스토리지 또는 서버 저장 선택

---

### ✅ Phase 4: 관리자 대시보드 기초 (1주일)
**목표**: 결제 시스템 연동 후 바로 사용할 수 있는 관리 UI

#### 4.1 관리자 대시보드 페이지
```
1. 대시보드 홈 (/admin)
   - 오늘의 매출
   - 이번 달 매출
   - 최근 주문 목록
   - 멤버십 통계

2. 주문 관리 (/admin/orders)
   - 주문 목록 (필터: 상태, 날짜)
   - 주문 상세 조회
   - 배송 상태 변경
   - 배송사/추적번호 입력

3. 상품 관리 (/admin/products)
   - 상품 목록
   - 상품 추가/수정/삭제
   - 재고 관리
   - 이미지 업로드

4. Drop 관리 (/admin/drops)
   - Drop 목록
   - Drop 생성/수정/삭제
   - 한정 수량 설정
   - 판매 현황

5. 회원 관리 (/admin/members)
   - 회원 목록 (필터: 멤버십 등급)
   - 회원 상세 조회
   - 멤버십 강제 변경
   - 회원 차단

6. 매출 분석 (/admin/analytics)
   - 일일/주간/월간 매출 그래프
   - 상품별 판매량
   - 멤버십 가입/해지 추이
   - CSV 다운로드
```

**개발 작업**:
- [ ] 관리자 권한 확인 미들웨어 구현
- [ ] 대시보드 홈 UI 구현
- [ ] 주문 관리 페이지 UI 구현
- [ ] 상품 관리 페이지 UI 구현
- [ ] Drop 관리 페이지 UI 구현
- [ ] 회원 관리 페이지 UI 구현
- [ ] 매출 분석 페이지 UI 구현

---

#### 4.2 관리자 API (tRPC)
```typescript
// server/routers/admin.ts
export const adminRouter = router({
  // 주문 관리
  orders: {
    list: adminProcedure.query(...),
    getById: adminProcedure.input(z.number()).query(...),
    updateStatus: adminProcedure.input(...).mutation(...),
    updateShipment: adminProcedure.input(...).mutation(...)
  },

  // 상품 관리
  products: {
    list: adminProcedure.query(...),
    create: adminProcedure.input(...).mutation(...),
    update: adminProcedure.input(...).mutation(...),
    delete: adminProcedure.input(z.number()).mutation(...)
  },

  // Drop 관리
  drops: {
    list: adminProcedure.query(...),
    create: adminProcedure.input(...).mutation(...),
    update: adminProcedure.input(...).mutation(...)
  },

  // 분석
  analytics: {
    getDailySales: adminProcedure.input(z.object({ 
      startDate: z.date(), 
      endDate: z.date() 
    })).query(...),
    getMembershipStats: adminProcedure.query(...)
  }
});
```

**개발 작업**:
- [ ] 관리자 권한 확인 프로시저 구현
- [ ] 주문 관리 API 구현
- [ ] 상품 관리 API 구현
- [ ] Drop 관리 API 구현
- [ ] 분석 API 구현

---

### ✅ Phase 5: 보안 및 규정 준수 (1주일)
**목표**: 결제 시스템 연동 전 보안 기초 완성

#### 5.1 개인정보보호 구현
```typescript
// 개인정보 암호화
- 주민등록번호: AES-256 암호화 (필요 시에만 저장)
- 전화번호: 해시 또는 암호화
- 주소: 필요한 범위만 저장

// 데이터 접근 제어
- 사용자는 자신의 정보만 조회 가능
- 관리자는 필요한 정보만 조회 가능
- 배송 정보는 배송사만 조회 가능
```

**개발 작업**:
- [ ] 개인정보 암호화 유틸리티 구현
- [ ] 접근 제어 미들웨어 구현
- [ ] 감사 로그(Audit Log) 테이블 생성
- [ ] 개인정보 삭제 요청 기능 구현 (GDPR/PIPA 대응)

---

#### 5.2 결제 보안
```typescript
// PCI-DSS 준수
- 신용카드 정보는 절대 서버에 저장하지 않음
- 토스페이먼츠에서 제공하는 결제 위젯 사용
- HTTPS 필수

// 결제 검증
- 결제 완료 후 서버에서 토스페이먼츠 API로 검증
- 주문 금액과 결제 금액 일치 확인
- 중복 결제 방지
```

**개발 작업**:
- [ ] 결제 검증 로직 구현
- [ ] HTTPS 설정 확인
- [ ] 결제 보안 테스트

---

#### 5.3 이용약관 및 개인정보보호정책
```
필요한 문서:
1. 이용약관
   - 서비스 이용 조건
   - 회원 가입 및 탈퇴
   - 주문 및 결제
   - 환불 정책
   - 책임 제한

2. 개인정보보호정책
   - 수집하는 개인정보 항목
   - 이용 목적
   - 보관 기간
   - 제3자 제공
   - 사용자 권리

3. 배송 및 반품 정책
   - 배송 기간
   - 배송료
   - 반품 조건
   - 환불 절차
```

**개발 작업**:
- [ ] 이용약관 페이지 구현
- [ ] 개인정보보호정책 페이지 구현
- [ ] 배송 및 반품 정책 페이지 구현
- [ ] 약관 동의 체크박스 추가 (회원가입, 결제 시)

---

### ✅ Phase 6: 테스트 및 품질 보증 (1주일)
**목표**: 결제 시스템 연동 전 기본 기능 검증

#### 6.1 단위 테스트 (Vitest)
```typescript
// 테스트 대상
- 주문 생성 로직
- 멤버십 상태 변경 로직
- 가격 계산 로직 (할인 적용)
- 배송료 계산 로직
```

**개발 작업**:
- [ ] 주문 생성 테스트
- [ ] 멤버십 로직 테스트
- [ ] 가격 계산 테스트
- [ ] 배송료 계산 테스트
- [ ] 테스트 커버리지 80% 이상 목표

---

#### 6.2 통합 테스트
```typescript
// 테스트 시나리오
1. 회원가입 → 상품 조회 → 주문 생성 → 결제 준비 완료
2. 회원가입 → 멤버십 구독 → 멤버십 혜택 적용 확인
3. 주문 생성 → 배송 정보 업데이트 → 배송 추적
```

**개발 작업**:
- [ ] 전체 주문 흐름 통합 테스트
- [ ] 멤버십 흐름 통합 테스트
- [ ] 배송 흐름 통합 테스트

---

#### 6.3 사용성 테스트
```
테스트 대상:
- 모바일 반응형 (iPhone, Android)
- 브라우저 호환성 (Chrome, Safari, Firefox, Edge)
- 페이지 로딩 속도
- 접근성 (WCAG 2.1 AA 기준)
```

**개발 작업**:
- [ ] 모바일 반응형 테스트
- [ ] 브라우저 호환성 테스트
- [ ] 성능 최적화 (LCP, FID, CLS)
- [ ] 접근성 검사

---

## 📅 병렬 개발 일정 제안

```
Week 1: Phase 1 (데이터베이스) + Phase 2 (API 설계)
  - 월~수: 주문/상품/멤버십 테이블 설계 및 생성
  - 목~금: 주문/상품/멤버십 API 구현

Week 2: Phase 3 (프론트엔드) + Phase 4 (관리자 대시보드)
  - 월~수: 상품 상세, 장바구니, 결제 페이지 UI
  - 목~금: 관리자 대시보드 기초 UI

Week 3: Phase 4 (계속) + Phase 5 (보안)
  - 월~수: 관리자 API 및 분석 페이지
  - 목~금: 개인정보 보호, 보안 구현

Week 4: Phase 5 (계속) + Phase 6 (테스트)
  - 월~수: 약관 및 정책 페이지, 접근성 개선
  - 목~금: 단위 테스트, 통합 테스트, 사용성 테스트
```

---

## 🎯 결과물 체크리스트

### 데이터베이스
- [x] Orders, OrderItems, Shipments 테이블
- [x] Products, Drops, DropProducts 테이블
- [x] MembershipPlans, UserMemberships, MembershipPayments 테이블

### 백엔드 API
- [x] 주문 관련 5개 프로시저
- [x] 상품 관련 4개 프로시저
- [x] 멤버십 관련 4개 프로시저
- [x] 관리자 관련 10+ 프로시저

### 프론트엔드
- [x] 7개 고객 페이지
- [x] 6개 관리자 페이지
- [x] 장바구니 상태 관리

### 보안 및 규정
- [x] 개인정보 암호화
- [x] 접근 제어 미들웨어
- [x] 이용약관, 개인정보보호정책, 배송 정책

### 테스트
- [x] 단위 테스트 (80% 커버리지)
- [x] 통합 테스트
- [x] 사용성 테스트

---

## 💡 추가 팁

### 1. 개발 우선순위
**높음 (필수)**:
- 주문 데이터베이스 설계
- 주문 생성/조회 API
- 결제 페이지 UI

**중간 (권장)**:
- 관리자 대시보드
- 멤버십 시스템
- 테스트

**낮음 (선택)**:
- 분석 페이지
- 고급 보안 기능

### 2. 개발 순서
1. **데이터베이스 먼저**: API 설계의 기반
2. **API 다음**: 프론트엔드 개발의 기반
3. **UI 마지막**: API가 준비되면 빠르게 개발 가능

### 3. 코드 재사용
- 기존 Home.tsx의 스타일 재사용
- 기존 폰트 및 컬러 시스템 활용
- 기존 애니메이션 라이브러리 활용

### 4. 테스트 작성 시기
- API 구현 직후: 단위 테스트
- 페이지 구현 후: 통합 테스트
- 전체 완성 후: 사용성 테스트

---

## 🚀 결제 시스템 연동 준비

이 모든 작업을 완료하면, 토스페이먼츠 가입 후 다음만 추가하면 됩니다:

```typescript
// 1. 결제 API 호출 로직
const handlePayment = async (orderId: number) => {
  // 토스페이먼츠 결제 위젯 호출
  // 결제 완료 후 서버 검증
  // 주문 상태 업데이트
};

// 2. Webhook 처리
app.post('/api/webhooks/toss', (req, res) => {
  // 결제 완료/실패 처리
  // 주문 상태 업데이트
  // 멤버십 활성화
});

// 3. 환불 로직
const handleRefund = async (orderId: number) => {
  // 토스페이먼츠 환불 API 호출
  // 주문 상태 업데이트
};
```

---

## 📞 질문 및 지원

각 Phase별로 구현 시작 전에 확인이 필요한 사항:
- [ ] 데이터베이스 스키마 검토
- [ ] API 설계 검토
- [ ] UI/UX 디자인 검토
- [ ] 보안 정책 검토

준비 완료 시 알려주세요!
