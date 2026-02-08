# Drop 관리 기능 상세 개발 계획

**작성일**: 2026-02-08  
**프로젝트**: MNI ACV (Brand & Drops)  
**목표**: Drop 관리 시스템 완전 구현

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [개발 단계](#2-개발-단계)
3. [Phase 1: 백엔드 API 구현](#3-phase-1-백엔드-api-구현)
4. [Phase 2: 프론트엔드 UI 구현](#4-phase-2-프론트엔드-ui-구현)
5. [Phase 3: 고급 기능 & 자동화](#5-phase-3-고급-기능--자동화)
6. [테스트 전략](#6-테스트-전략)
7. [배포 및 모니터링](#7-배포-및-모니터링)

---

## 1. 프로젝트 개요

### 1.1 목표
- 관리자가 Drop을 생성, 수정, 삭제할 수 있는 완전한 관리 시스템 구축
- Drop에 포함된 상품을 동적으로 관리
- Drop 판매 통계 및 자동 상태 관리

### 1.2 범위
- **포함**: Drop CRUD, 상품 관리, 통계, 자동화, 관리자 UI
- **제외**: 이메일 알림, SNS 연동, 다국어 지원 (향후 확장)

### 1.3 성공 기준
- ✅ 모든 API 엔드포인트 구현 및 테스트 완료
- ✅ 관리자 UI 페이지 구현 및 기능 검증
- ✅ 90% 이상 테스트 커버리지
- ✅ 성능 최적화 (응답 시간 < 500ms)

---

## 2. 개발 단계

### 2.1 전체 일정 (예상 4주)

```
Week 1: Phase 1 - 백엔드 API (Drop CRUD)
  - Mon-Tue: 데이터베이스 헬퍼 함수 구현
  - Wed-Thu: tRPC 라우터 구현
  - Fri: 테스트 작성 및 검증

Week 2: Phase 1 - 백엔드 API (상품 관리)
  - Mon-Tue: 상품 추가/제거 API 구현
  - Wed: 한정 수량 수정 API 구현
  - Thu-Fri: 통합 테스트 및 버그 수정

Week 3: Phase 2 - 프론트엔드 UI
  - Mon-Tue: 관리자 Drop 목록 페이지
  - Wed-Thu: Drop 생성/수정 폼
  - Fri: Drop 상세 관리 페이지

Week 4: Phase 3 - 고급 기능 & 마무리
  - Mon-Tue: 판매 통계 API 및 UI
  - Wed: 상태 자동 업데이트 구현
  - Thu-Fri: 최종 테스트 및 배포
```

### 2.2 마일스톤

| 마일스톤 | 목표 | 예상 완료일 |
|---------|------|-----------|
| M1 | Drop CRUD API 완료 | Week 1 금요일 |
| M2 | 상품 관리 API 완료 | Week 2 금요일 |
| M3 | 관리자 UI 완료 | Week 3 금요일 |
| M4 | 고급 기능 완료 | Week 4 목요일 |
| M5 | 최종 테스트 & 배포 | Week 4 금요일 |

---

## 3. Phase 1: 백엔드 API 구현

### 3.1 데이터베이스 헬퍼 함수 (`server/db.ts`)

#### 3.1.1 Drop 관련 함수

```typescript
// Drop 생성
export async function createDrop(data: {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}): Promise<number>

// Drop 수정
export async function updateDrop(id: number, data: {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: "upcoming" | "active" | "ended";
}): Promise<Drop | null>

// Drop 삭제
export async function deleteDrop(id: number): Promise<boolean>

// 모든 Drop 조회 (관리자용)
export async function getAllDrops(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Drop[]; total: number }>

// Drop 상태 자동 업데이트
export async function updateDropStatusesAutomatically(): Promise<number>
```

#### 3.1.2 DropProduct 관련 함수

```typescript
// Drop에 상품 추가
export async function addProductToDrop(data: {
  dropId: number;
  productId: number;
  limitedQuantity: number;
}): Promise<DropProduct | null>

// Drop에서 상품 제거
export async function removeProductFromDrop(
  dropId: number,
  productId: number
): Promise<boolean>

// Drop 상품 한정 수량 수정
export async function updateDropProductQuantity(
  dropId: number,
  productId: number,
  limitedQuantity: number
): Promise<DropProduct | null>

// Drop 판매 통계 조회
export async function getDropStats(dropId: number): Promise<{
  dropId: number;
  dropName: string;
  totalProducts: number;
  products: Array<{
    productId: number;
    productName: string;
    limitedQuantity: number;
    soldQuantity: number;
    remainingQuantity: number;
    soldPercentage: number;
  }>;
  totalSold: number;
  totalLimited: number;
  soldPercentage: number;
}>
```

**파일**: `server/db.ts`  
**예상 라인 수**: 150-200줄  
**의존성**: Drizzle ORM, 기존 db 함수

---

### 3.2 tRPC 라우터 (`server/routers/drops.ts`)

#### 3.2.1 현재 구조 분석
```typescript
// 기존 공개 프로시저 (publicProcedure)
- getCurrent()
- getNext()
- getById(id)
- getProducts(dropId)
- getByStatus(status)
- getCurrentCountdown()
```

#### 3.2.2 추가할 관리자 프로시저 (adminProcedure)

**파일**: `server/routers/drops.ts`  
**변경 사항**: 기존 파일에 추가

```typescript
// Drop CRUD
create: adminProcedure
  .input(CreateDropSchema)
  .mutation(async ({ ctx, input }) => { ... })

update: adminProcedure
  .input(UpdateDropSchema)
  .mutation(async ({ ctx, input }) => { ... })

delete: adminProcedure
  .input(z.number().int().positive())
  .mutation(async ({ ctx, input }) => { ... })

getAll: adminProcedure
  .input(GetAllDropsSchema.optional())
  .query(async ({ ctx, input }) => { ... })

// 상품 관리
addProduct: adminProcedure
  .input(AddProductToDropSchema)
  .mutation(async ({ ctx, input }) => { ... })

removeProduct: adminProcedure
  .input(RemoveProductFromDropSchema)
  .mutation(async ({ ctx, input }) => { ... })

updateProductQuantity: adminProcedure
  .input(UpdateProductQuantitySchema)
  .mutation(async ({ ctx, input }) => { ... })

// 통계
getStats: adminProcedure
  .input(z.number().int().positive())
  .query(async ({ ctx, input }) => { ... })
```

**Zod 스키마**:
```typescript
const CreateDropSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate < data.endDate, {
  message: "startDate must be before endDate",
  path: ["endDate"],
});

const UpdateDropSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["upcoming", "active", "ended"]).optional(),
});

const AddProductToDropSchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
  limitedQuantity: z.number().int().positive(),
});

const RemoveProductFromDropSchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

const UpdateProductQuantitySchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
  limitedQuantity: z.number().int().positive(),
});

const GetAllDropsSchema = z.object({
  status: z.enum(["upcoming", "active", "ended"]).optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});
```

**예상 라인 수**: 200-250줄  
**테스트**: 별도 파일 `server/routers/drops.test.ts`

---

### 3.3 테스트 작성 (`server/routers/drops.test.ts`)

#### 3.3.1 테스트 케이스 (총 25개)

**Drop CRUD (10개 테스트)**
```
✓ should create a drop with valid data
✓ should not create a drop with invalid dates
✓ should update a drop
✓ should not update a non-existent drop
✓ should delete a drop
✓ should not delete an active drop
✓ should get all drops with filters
✓ should get all drops with pagination
✓ should prevent non-admin from creating drop
✓ should prevent non-admin from deleting drop
```

**상품 관리 (10개 테스트)**
```
✓ should add product to drop
✓ should not add duplicate product to drop
✓ should not add product with invalid quantity
✓ should remove product from drop
✓ should not remove product from non-existent drop
✓ should update product quantity
✓ should not update quantity below sold quantity
✓ should prevent non-admin from adding product
✓ should prevent non-admin from removing product
✓ should prevent non-admin from updating quantity
```

**통계 (5개 테스트)**
```
✓ should get drop statistics
✓ should calculate sold percentage correctly
✓ should handle drop with no products
✓ should handle drop with no sales
✓ should prevent non-admin from viewing stats
```

**파일**: `server/routers/drops.test.ts`  
**예상 라인 수**: 400-500줄

---

## 4. Phase 2: 프론트엔드 UI 구현

### 4.1 페이지 구조

#### 4.1.1 관리자 Drop 관리 페이지
**경로**: `/admin/drops`  
**파일**: `client/src/pages/AdminDrops.tsx`

**기능**:
1. Drop 목록 테이블
   - 모든 Drop 표시 (upcoming, active, ended)
   - 상태별 필터링
   - 생성일, 시작일, 종료일 표시
   - 수정/삭제 버튼

2. Drop 생성 버튼
   - 모달 또는 새 페이지로 이동

3. 검색 및 필터
   - 상태 필터 (upcoming, active, ended)
   - 페이지네이션

**예상 라인 수**: 250-300줄

---

#### 4.1.2 Drop 생성/수정 폼
**경로**: `/admin/drops/new` (생성) 또는 `/admin/drops/:id/edit` (수정)  
**파일**: `client/src/pages/AdminDropForm.tsx`

**기능**:
1. 폼 필드
   - Drop 이름 (텍스트 입력)
   - 설명 (텍스트 에어리어)
   - 시작 시간 (날짜/시간 선택)
   - 종료 시간 (날짜/시간 선택)
   - 상태 (선택 박스, 수정 시만)

2. 유효성 검증
   - 필수 필드 검증
   - 날짜 범위 검증
   - 실시간 피드백

3. 제출 처리
   - 성공/실패 메시지
   - 자동 리다이렉트

**예상 라인 수**: 200-250줄

---

#### 4.1.3 Drop 상세 관리 페이지
**경로**: `/admin/drops/:id`  
**파일**: `client/src/pages/AdminDropDetail.tsx`

**기능**:
1. Drop 정보 표시
   - 기본 정보 (이름, 설명, 상태)
   - 시간 정보 (시작, 종료, 남은 시간)
   - 수정 버튼

2. 상품 관리
   - 포함된 상품 테이블
   - 한정 수량, 판매량, 남은 수량 표시
   - 상품 추가 버튼
   - 상품별 수정/삭제 버튼

3. 판매 통계
   - 전체 판매율 차트
   - 상품별 판매율
   - 판매량 통계

**예상 라인 수**: 300-350줄

---

#### 4.1.4 상품 추가 모달
**파일**: `client/src/components/AddProductToDropModal.tsx`

**기능**:
1. 상품 선택
   - 드롭다운 또는 검색
   - 이미 추가된 상품 제외

2. 한정 수량 입력
   - 숫자 입력
   - 유효성 검증

3. 추가 버튼

**예상 라인 수**: 150-200줄

---

### 4.2 라우팅 업데이트
**파일**: `client/src/App.tsx`

```typescript
// 추가할 라우트
<Route path={"/admin/drops"} component={AdminDrops} />
<Route path={"/admin/drops/new"} component={AdminDropForm} />
<Route path={"/admin/drops/:id"} component={AdminDropDetail} />
<Route path={"/admin/drops/:id/edit"} component={AdminDropForm} />
```

---

### 4.3 컴포넌트 재사용

**기존 컴포넌트 활용**:
- `Button` - 모든 버튼
- `Card` - 정보 표시
- `Input` - 텍스트 입력
- `Select` - 상태/상품 선택
- `Dialog` - 확인 모달

**새 컴포넌트**:
- `DropTable` - Drop 목록 테이블
- `DropForm` - Drop 정보 폼
- `ProductTable` - 상품 목록 테이블
- `StatsChart` - 판매 통계 차트

---

## 5. Phase 3: 고급 기능 & 자동화

### 5.1 Drop 상태 자동 업데이트

**구현 방법**: Node.js `node-cron` 패키지

**파일**: `server/_core/dropScheduler.ts`

```typescript
import cron from 'node-cron';
import { updateDropStatusesAutomatically } from '../db';

export function initDropScheduler() {
  // 매 분마다 실행
  cron.schedule('* * * * *', async () => {
    try {
      const updated = await updateDropStatusesAutomatically();
      console.log(`[Drop Scheduler] Updated ${updated} drops`);
    } catch (error) {
      console.error('[Drop Scheduler] Error:', error);
    }
  });
}
```

**서버 시작 시 초기화**:
```typescript
// server/_core/server.ts 또는 main 파일
import { initDropScheduler } from './dropScheduler';

// 서버 시작 후
initDropScheduler();
```

**예상 라인 수**: 30-50줄

---

### 5.2 판매 통계 UI

**파일**: `client/src/components/DropStatsChart.tsx`

**기능**:
1. 전체 판매율 (원형 차트)
2. 상품별 판매량 (막대 차트)
3. 판매 통계 테이블

**라이브러리**: Recharts (기존 사용)

**예상 라인 수**: 150-200줄

---

### 5.3 관리자 대시보드 통합

**파일**: `client/src/pages/AdminDashboard.tsx` (기존 파일 수정)

**추가 위젯**:
1. 현재 활성 Drop
2. 다음 예정된 Drop
3. 최근 Drop 판매 통계
4. Drop별 판매율 비교

**예상 변경 라인 수**: 100-150줄

---

## 6. 테스트 전략

### 6.1 단위 테스트 (Vitest)

**대상**:
- 데이터베이스 헬퍼 함수 (db.ts)
- tRPC 라우터 (drops.ts)
- Zod 스키마 검증

**커버리지 목표**: 90% 이상

**파일**:
- `server/routers/drops.test.ts` (25개 테스트)
- `server/db.test.ts` (추가 테스트)

---

### 6.2 통합 테스트

**시나리오**:
1. Drop 생성 → 상품 추가 → 조회 → 수정 → 삭제
2. Drop 상태 자동 업데이트 검증
3. 권한 검증 (관리자만 가능)

**파일**: `server/routers/drops.integration.test.ts`

---

### 6.3 E2E 테스트 (수동)

**테스트 케이스**:
1. 관리자 로그인 → Drop 관리 페이지 접근
2. Drop 생성 → 상품 추가 → 저장
3. Drop 수정 → 상품 제거 → 저장
4. Drop 삭제 → 확인
5. 공개 페이지에서 Drop 조회 확인

---

## 7. 배포 및 모니터링

### 7.1 배포 체크리스트

```
[ ] 모든 테스트 통과 (90% 이상 커버리지)
[ ] TypeScript 에러 없음
[ ] 성능 최적화 (응답 시간 < 500ms)
[ ] 보안 검토 (adminProcedure 적용)
[ ] 데이터베이스 마이그레이션 검증
[ ] 환경 변수 설정 확인
[ ] 로깅 설정 확인
[ ] 최종 E2E 테스트 완료
[ ] 체크포인트 생성
[ ] 배포 실행
```

### 7.2 모니터링

**메트릭**:
- API 응답 시간
- 에러율
- 데이터베이스 쿼리 성능
- Drop 상태 업데이트 성공률

**로깅**:
- Drop 생성/수정/삭제 이벤트
- 상품 추가/제거 이벤트
- 에러 로그

---

## 8. 파일 구조 요약

### 8.1 백엔드 변경사항

```
server/
├── db.ts                          [수정] Drop 헬퍼 함수 추가
├── routers/
│   ├── drops.ts                   [수정] adminProcedure 추가
│   └── drops.test.ts              [신규] 25개 테스트
└── _core/
    └── dropScheduler.ts           [신규] 상태 자동 업데이트
```

### 8.2 프론트엔드 변경사항

```
client/src/
├── App.tsx                        [수정] 관리자 라우트 추가
├── pages/
│   ├── AdminDrops.tsx             [신규] Drop 목록 페이지
│   ├── AdminDropForm.tsx          [신규] Drop 생성/수정 폼
│   ├── AdminDropDetail.tsx        [신규] Drop 상세 관리
│   └── AdminDashboard.tsx         [수정] Drop 위젯 추가
└── components/
    ├── AddProductToDropModal.tsx  [신규] 상품 추가 모달
    ├── DropTable.tsx              [신규] Drop 테이블
    ├── ProductTable.tsx           [신규] 상품 테이블
    └── DropStatsChart.tsx         [신규] 통계 차트
```

---

## 9. 개발 체크리스트

### Phase 1: 백엔드 API

- [ ] **Week 1 - Drop CRUD**
  - [ ] 데이터베이스 헬퍼 함수 구현 (createDrop, updateDrop, deleteDrop, getAllDrops)
  - [ ] tRPC 라우터 구현 (create, update, delete, getAll)
  - [ ] Zod 스키마 정의
  - [ ] 단위 테스트 작성 (10개)
  - [ ] 통합 테스트 및 버그 수정
  - [ ] 체크포인트 1 생성

- [ ] **Week 2 - 상품 관리 & 통계**
  - [ ] 상품 추가/제거 함수 구현
  - [ ] 한정 수량 수정 함수 구현
  - [ ] tRPC 라우터 구현 (addProduct, removeProduct, updateProductQuantity)
  - [ ] 통계 함수 구현 (getDropStats)
  - [ ] 단위 테스트 작성 (15개)
  - [ ] 통합 테스트 및 버그 수정
  - [ ] 체크포인트 2 생성

### Phase 2: 프론트엔드 UI

- [ ] **Week 3 - 관리자 페이지**
  - [ ] AdminDrops 페이지 구현 (목록, 필터, 페이지네이션)
  - [ ] AdminDropForm 페이지 구현 (생성/수정)
  - [ ] AdminDropDetail 페이지 구현 (상세 관리)
  - [ ] AddProductToDropModal 컴포넌트 구현
  - [ ] 라우팅 업데이트
  - [ ] UI 테스트 및 버그 수정
  - [ ] 체크포인트 3 생성

### Phase 3: 고급 기능

- [ ] **Week 4 - 자동화 & 통계**
  - [ ] Drop 상태 자동 업데이트 구현 (dropScheduler.ts)
  - [ ] DropStatsChart 컴포넌트 구현
  - [ ] AdminDashboard 통합
  - [ ] 최종 테스트 및 버그 수정
  - [ ] 성능 최적화
  - [ ] 보안 검토
  - [ ] 최종 체크포인트 생성
  - [ ] 배포

---

## 10. 예상 코드량

| 항목 | 파일 수 | 라인 수 | 비고 |
|------|--------|--------|------|
| 백엔드 API | 3 | 650 | db.ts, drops.ts, drops.test.ts |
| 자동화 | 1 | 50 | dropScheduler.ts |
| 프론트엔드 | 7 | 1,500 | 4개 페이지 + 3개 컴포넌트 |
| **총계** | **11** | **2,200** | |

---

## 11. 리스크 및 대응 방안

| 리스크 | 영향 | 대응 방안 |
|--------|------|---------|
| 날짜 검증 복잡도 | 중 | Zod 스키마 사전 검증 |
| 상태 자동 업데이트 타이밍 | 중 | cron 스케줄 테스트 강화 |
| 권한 검증 누락 | 높음 | adminProcedure 필수 사용 |
| UI 복잡도 | 중 | 컴포넌트 재사용 극대화 |
| 성능 저하 | 중 | 데이터베이스 인덱스 추가 |

---

## 12. 다음 단계

1. **즉시 시작**: Phase 1 - 백엔드 API 구현
2. **병렬 진행 가능**: 테스트 작성 (TDD 권장)
3. **의존성**: Phase 2는 Phase 1 완료 후 시작
4. **최적화**: Phase 3는 Phase 2 완료 후 시작

---

## 13. 참고 자료

- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [tRPC 문서](https://trpc.io/)
- [Zod 문서](https://zod.dev/)
- [node-cron 문서](https://github.com/kelektiv/node-cron)
- [Recharts 문서](https://recharts.org/)

---

**문서 버전**: 1.0  
**마지막 수정**: 2026-02-08  
**작성자**: Development Team
