# Drop 관리 기능 설계 문서

## 1. 개요

현재 MNI ACV의 Drop 기능은 **공개 조회 기능**만 구현되어 있습니다. 관리자가 Drop을 생성, 수정, 삭제하고 상품을 추가/제거할 수 있는 **관리 기능**이 필요합니다.

---

## 2. 현재 상태 분석

### 2.1 기존 구현 (공개 기능)
- ✅ 현재 진행 중인 Drop 조회 (`getCurrent`)
- ✅ 다음 예정된 Drop 조회 (`getNext`)
- ✅ Drop 상세 조회 (`getById`)
- ✅ Drop 내 상품 조회 (`getProducts`) - 한정 수량, 판매량 포함
- ✅ 상태별 Drop 조회 (`getByStatus`)
- ✅ 카운트다운 정보 조회 (`getCurrentCountdown`)

### 2.2 데이터베이스 스키마
```
drops 테이블:
- id (PK)
- name (Drop 이름)
- description (설명)
- startDate (시작 시간)
- endDate (종료 시간)
- status (upcoming, active, ended)
- createdAt, updatedAt

dropProducts 테이블:
- id (PK)
- dropId (FK)
- productId (FK)
- limitedQuantity (한정 수량)
- soldQuantity (판매량)
- createdAt
```

---

## 3. 필요한 관리 기능 설계

### 3.1 Drop 관리 (CRUD)

#### 3.1.1 Drop 생성 (Create)
**엔드포인트**: `drops.create` (adminProcedure)

**입력 데이터**:
```typescript
{
  name: string;           // Drop 이름 (필수)
  description?: string;   // Drop 설명 (선택)
  startDate: Date;        // 시작 시간 (필수)
  endDate: Date;          // 종료 시간 (필수)
}
```

**비즈니스 로직**:
- 관리자만 생성 가능
- startDate < endDate 검증
- 중복된 이름 검증 (선택사항)
- 생성 시 상태는 자동으로 `upcoming` 설정

**반환값**:
```typescript
{
  id: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming";
  createdAt: Date;
}
```

---

#### 3.1.2 Drop 수정 (Update)
**엔드포인트**: `drops.update` (adminProcedure)

**입력 데이터**:
```typescript
{
  id: number;             // Drop ID (필수)
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: "upcoming" | "active" | "ended";
}
```

**비즈니스 로직**:
- 관리자만 수정 가능
- Drop이 존재하는지 확인
- 이미 시작된 Drop의 startDate는 수정 불가 (선택사항)
- 진행 중인 Drop의 endDate 수정 시 경고 (선택사항)
- 상태 변경 시 자동으로 updatedAt 갱신

**반환값**: 수정된 Drop 정보

---

#### 3.1.3 Drop 삭제 (Delete)
**엔드포인트**: `drops.delete` (adminProcedure)

**입력 데이터**:
```typescript
{
  id: number;  // Drop ID
}
```

**비즈니스 로직**:
- 관리자만 삭제 가능
- Drop이 존재하는지 확인
- 진행 중인 Drop은 삭제 불가 (상태가 active인 경우)
- 연관된 dropProducts 자동 삭제 (CASCADE)
- 삭제된 Drop의 상품들은 일반 상품으로 복귀

**반환값**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### 3.1.4 모든 Drop 조회 (관리자용)
**엔드포인트**: `drops.getAll` (adminProcedure)

**입력 데이터** (선택사항):
```typescript
{
  status?: "upcoming" | "active" | "ended";
  limit?: number;
  offset?: number;
}
```

**반환값**:
```typescript
{
  items: Drop[];
  total: number;
  limit: number;
  offset: number;
}
```

---

### 3.2 Drop 내 상품 관리

#### 3.2.1 Drop에 상품 추가
**엔드포인트**: `drops.addProduct` (adminProcedure)

**입력 데이터**:
```typescript
{
  dropId: number;
  productId: number;
  limitedQuantity: number;  // 한정 수량
}
```

**비즈니스 로직**:
- 관리자만 추가 가능
- Drop과 Product가 존재하는지 확인
- 이미 추가된 상품인지 확인 (중복 방지)
- limitedQuantity > 0 검증
- 상품의 stock >= limitedQuantity 검증 (선택사항)

**반환값**:
```typescript
{
  id: number;
  dropId: number;
  productId: number;
  limitedQuantity: number;
  soldQuantity: number;
  createdAt: Date;
}
```

---

#### 3.2.2 Drop에서 상품 제거
**엔드포인트**: `drops.removeProduct` (adminProcedure)

**입력 데이터**:
```typescript
{
  dropId: number;
  productId: number;
}
```

**비즈니스 로직**:
- 관리자만 제거 가능
- dropProduct 레코드가 존재하는지 확인
- 진행 중인 Drop에서 상품 제거 시 경고 (선택사항)
- 판매된 상품의 경우 제거 불가 (선택사항)

**반환값**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### 3.2.3 Drop 상품 한정 수량 수정
**엔드포인트**: `drops.updateProductQuantity` (adminProcedure)

**입력 데이터**:
```typescript
{
  dropId: number;
  productId: number;
  limitedQuantity: number;
}
```

**비즈니스 로직**:
- 관리자만 수정 가능
- limitedQuantity > soldQuantity 검증
- 수정 후 remainingQuantity 자동 계산

**반환값**: 수정된 dropProduct 정보

---

### 3.3 Drop 상태 자동 관리

#### 3.3.1 Drop 상태 자동 업데이트 (백그라운드 작업)
**목적**: 현재 시간에 따라 Drop 상태를 자동으로 업데이트

**로직**:
- 매 분마다 실행 (또는 특정 시간 간격)
- `startDate <= now < endDate` → 상태를 `active`로 변경
- `now >= endDate` → 상태를 `ended`로 변경

**구현 방법**:
- Node.js `node-cron` 패키지 사용
- 또는 서버 시작 시 setInterval 사용

---

### 3.4 Drop 통계 및 분석

#### 3.4.1 Drop 판매 통계
**엔드포인트**: `drops.getStats` (adminProcedure)

**입력 데이터**:
```typescript
{
  dropId: number;
}
```

**반환값**:
```typescript
{
  dropId: number;
  dropName: string;
  totalProducts: number;
  products: {
    productId: number;
    productName: string;
    limitedQuantity: number;
    soldQuantity: number;
    remainingQuantity: number;
    soldPercentage: number;
  }[];
  totalSold: number;
  totalLimited: number;
  soldPercentage: number;
}
```

---

## 4. UI/UX 설계

### 4.1 관리자 Drop 관리 페이지
**경로**: `/admin/drops`

**기능**:
1. **Drop 목록 테이블**
   - 모든 Drop 표시 (upcoming, active, ended)
   - 상태별 필터링
   - 생성일, 시작일, 종료일 표시
   - 수정/삭제 버튼

2. **Drop 생성 폼**
   - 이름, 설명, 시작/종료 시간 입력
   - 유효성 검증
   - 성공/실패 메시지

3. **Drop 상세 페이지**
   - Drop 정보 표시
   - 포함된 상품 목록
   - 상품 추가/제거 기능
   - 한정 수량 수정 기능
   - 판매 통계 표시

### 4.2 관리자 대시보드 통합
**경로**: `/admin/dashboard`

**Drop 관련 위젯**:
- 현재 활성 Drop 표시
- 다음 예정된 Drop 표시
- 최근 Drop 판매 통계
- Drop별 판매율 차트

---

## 5. 데이터베이스 마이그레이션

### 5.1 필요한 변경사항
현재 스키마는 기본적으로 충분하지만, 다음 컬럼 추가를 고려:

```sql
ALTER TABLE drops ADD COLUMN imageUrl VARCHAR(255);
ALTER TABLE drops ADD COLUMN bannerUrl VARCHAR(255);
ALTER TABLE drops ADD COLUMN theme VARCHAR(50);  -- 'summer', 'winter', etc.
ALTER TABLE drops ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public';
```

---

## 6. 보안 고려사항

1. **역할 기반 접근 제어 (RBAC)**
   - 모든 관리 엔드포인트는 `adminProcedure` 사용
   - 관리자만 Drop 생성/수정/삭제 가능

2. **입력 검증**
   - Zod 스키마로 모든 입력 검증
   - 날짜 범위 검증
   - 수량 검증

3. **감사 로그**
   - Drop 생성/수정/삭제 이력 기록 (선택사항)
   - 관리자 계정 기록

---

## 7. 구현 순서 (우선순위)

### Phase 1: 기본 CRUD (필수)
1. ✅ Drop 생성 (`drops.create`)
2. ✅ Drop 수정 (`drops.update`)
3. ✅ Drop 삭제 (`drops.delete`)
4. ✅ 모든 Drop 조회 (`drops.getAll`)
5. ✅ Drop에 상품 추가 (`drops.addProduct`)
6. ✅ Drop에서 상품 제거 (`drops.removeProduct`)

### Phase 2: 고급 기능 (권장)
7. ✅ Drop 상품 한정 수량 수정 (`drops.updateProductQuantity`)
8. ✅ Drop 판매 통계 (`drops.getStats`)
9. ✅ Drop 상태 자동 업데이트 (백그라운드 작업)

### Phase 3: UI 구현 (선택)
10. ✅ 관리자 Drop 관리 페이지 (`/admin/drops`)
11. ✅ Drop 상세 관리 페이지
12. ✅ 관리자 대시보드 통합

---

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest)
- Drop CRUD 작업 테스트
- 입력 검증 테스트
- 상품 추가/제거 테스트
- 통계 계산 테스트

### 8.2 통합 테스트
- Drop 생성 → 상품 추가 → 조회 플로우
- Drop 삭제 시 연관 데이터 정리
- 상태 자동 업데이트 테스트

### 8.3 E2E 테스트
- 관리자 UI를 통한 Drop 관리 전체 플로우
- 공개 페이지에서 Drop 조회 확인

---

## 9. 향후 확장 기능

1. **Drop 예약 기능**
   - Drop 자동 시작/종료 스케줄링
   - 푸시 알림 (사용자에게 Drop 시작 알림)

2. **Drop 템플릿**
   - 자주 사용되는 Drop 설정 저장/재사용

3. **Drop 분석**
   - 판매 추이 그래프
   - 인기 상품 분석
   - 고객 행동 분석

4. **Drop 마케팅**
   - 이메일 캠페인 연동
   - SNS 공유 기능
   - 조기 액세스 (VIP 사용자)

5. **다국어 지원**
   - Drop 정보 다국어 지원
   - 지역별 Drop 설정

---

## 10. 요약

Drop 관리 기능은 다음 3가지 핵심 영역으로 구성됩니다:

| 영역 | 기능 | 우선순위 |
|------|------|---------|
| **Drop CRUD** | 생성, 수정, 삭제, 조회 | 🔴 필수 |
| **상품 관리** | 상품 추가, 제거, 수량 수정 | 🔴 필수 |
| **통계 & 자동화** | 판매 통계, 상태 자동 업데이트 | 🟡 권장 |
| **관리 UI** | 관리자 페이지 구현 | 🟡 권장 |

이 설계를 따라 구현하면 **완전한 Drop 관리 시스템**을 갖추게 됩니다.
