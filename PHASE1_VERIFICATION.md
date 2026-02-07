# Phase 1 데이터베이스 마이그레이션 검증

## 생성된 테이블 목록

### 1. 주문 관련 테이블
- ✅ `orders` - 주문 정보
- ✅ `orderItems` - 주문 상품 상세
- ✅ `shipments` - 배송 정보

### 2. 상품 및 Drop 테이블
- ✅ `products` - 상품 정보
- ✅ `drops` - Drop 정보
- ✅ `dropProducts` - Drop-Product 연결

### 3. 멤버십 테이블
- ✅ `membershipPlans` - 멤버십 플랜
- ✅ `userMemberships` - 사용자 멤버십
- ✅ `membershipPayments` - 멤버십 결제 이력

## 초기 데이터 입력 확인

### 멤버십 플랜
```
Free (무료)
- 월 가격: 0원
- 할인율: 0%
- 배송료 무료: X
- 혜택: 갤러리 열람, 뉴스레터 구독

Member (멤버)
- 월 가격: 4,900원
- 할인율: 10%
- 배송료 무료: O
- 혜택: Drop 사전 공개, 10% 할인, 배송료 무료

VIP (VIP)
- 월 가격: 9,900원
- 할인율: 20%
- 배송료 무료: O
- 혜택: 모든 Member 혜택, 한정판 상품 조기 구매, 20% 할인
```

### 상품
```
1. TOILET PAPER TEE
   - 가격: 80,000원
   - 카테고리: tee
   - 재고: 100개
   - 상태: active

2. STICK HOODIE
   - 가격: 120,000원
   - 카테고리: hoodie
   - 재고: 50개
   - 상태: active
```

### Drop
```
Archive #1
- 시작: 현재
- 종료: 3일 후
- 상태: active
- 포함 상품: TOILET PAPER TEE (100개 한정), STICK HOODIE (50개 한정)
```

## Drizzle 스키마 업데이트 완료

✅ 모든 테이블의 TypeScript 타입 정의 추가됨
- Product, InsertProduct
- Drop, InsertDrop
- DropProduct, InsertDropProduct
- Order, InsertOrder
- OrderItem, InsertOrderItem
- Shipment, InsertShipment
- MembershipPlan, InsertMembershipPlan
- UserMembership, InsertUserMembership
- MembershipPayment, InsertMembershipPayment

## 검증 쿼리 (필요시 실행)

```sql
-- 테이블 존재 확인
SHOW TABLES LIKE 'orders';
SHOW TABLES LIKE 'products';
SHOW TABLES LIKE 'membershipPlans';

-- 멤버십 플랜 확인
SELECT * FROM membershipPlans;

-- 상품 확인
SELECT * FROM products;

-- Drop 확인
SELECT * FROM drops;

-- Drop-Product 연결 확인
SELECT dp.*, d.name as dropName, p.name as productName
FROM dropProducts dp
JOIN drops d ON dp.dropId = d.id
JOIN products p ON dp.productId = p.id;
```

## 다음 단계

Phase 2: 백엔드 API 구현
- 상품 조회 API
- 주문 생성/조회 API
- 멤버십 관리 API
