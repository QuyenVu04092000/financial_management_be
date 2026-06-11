---
feature: budget-improvement
status: In-Progress
created_at: 2026-06-11
updated_at: 2026-06-11
---

# Task List: Budget Improvement

## 🗄️ DATABASE

- [x] **DB-01**: Thêm index vào `BudCategory` và `SubBudCategory` trong `src/prisma/schema.prisma`
  - [x] Thêm `@@index([userId, month])` vào model `BudCategory`
  - [x] Thêm `@@index([userId, month])` vào model `SubBudCategory`
  - [x] Chạy `npx prisma migrate dev --name add_budget_month_index`
  - [x] Chạy `npx prisma generate`
  - **Lý do:** Tối ưu query lịch sử nhiều tháng — không có index thì scan toàn bộ records của user (EC-02)

---

## 📦 BACKEND (BE)

### BE-01 — Fix DTO: validate `budget >= 1` và thêm field `limit`

- **File sửa:** `src/common/dto/budget/budget.dto.ts`
- **Prisma thay đổi:** Không
- **Migration:** Không
- [x] Đổi `@Min(0)` → `@Min(1)` trên field `budget` trong `CategoryBudgetCreateRequestDto`
- [x] Đổi `@Min(0)` → `@Min(1)` trên field `budget` trong `SubCategoryBudgetCreateRequestDto`
- [x] Thêm field `limit` vào `BudgetQueryDto`:
  ```typescript
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
  ```
- [x] Import thêm `Max` từ `class-validator` nếu chưa có

---

### BE-02 — Fix `calculatePeriodForMonth`: clamp endDay cho tháng ngắn

- **File sửa:** `src/modules/budget/services/budget.service.ts`
- **Prisma thay đổi:** Không
- **Migration:** Không
- [x] Tìm hàm `calculatePeriodForMonth` (khoảng dòng 184)
- [x] Thay logic tính `endDate` hiện tại bằng cách clamp `endDay` về ngày cuối tháng thực tế:
  ```typescript
  const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const rawEndDay = startDayMonth - 1 === 0 ? lastDayOfNextMonth : startDayMonth - 1;
  const endDay = Math.min(rawEndDay, lastDayOfNextMonth);
  const endDate = new Date(nextYear, nextMonth, endDay, 23, 59, 59, 999);
  ```
- [x] Verify thủ công: `startDayMonth=31`, `month="2025-01"` → `endDate` phải là `28/02/2025`, không phải `03/03/2025`

---

### BE-03 — Thêm aggregate query vào `TransactionRepository` (tránh N+1)

- **File sửa:** `src/modules/transaction/repositories/transaction.repository.ts`
- **Prisma thay đổi:** Không
- **Migration:** Không
- [x] Thêm method `getExpenseAggregateByCategoryIds`:
  ```typescript
  async getExpenseAggregateByCategoryIds(
    userId: string,
    filters: Array<{ categoryId: string; startDate: Date; endDate: Date }>,
  ): Promise<Map<string, number>>
  // Key của Map: `${categoryId}_${YYYY-MM}` — service dùng để lookup O(1)
  ```
- [x] Thêm method `getExpenseAggregateBySubCategoryIds` tương tự cho sub-category
- [x] Cả 2 method dùng Prisma `groupBy` hoặc `$queryRaw` để ra 1 DB query duy nhất

---

### BE-04 — Refactor `BudgetService`: dùng aggregate query + hỗ trợ `limit`

- **File sửa:** `src/modules/budget/services/budget.service.ts`
- **Prisma thay đổi:** Không
- **Migration:** Không
- [x] Inject thêm `TransactionRepository` vào constructor (thay thế hoặc bổ sung `TransactionService` tùy theo circular dependency)
- [x] Sửa `getCategoryBudgets`:
  - Truyền `query.limit` xuống repository (default `12` nếu không có)
  - Bỏ `Promise.all` N lần → gọi 1 lần `getExpenseAggregateByCategoryIds` với toàn bộ budgets
  - Map kết quả vào `CategoryBudgetResponseDto`
- [x] Sửa `getSubCategoryBudgets`:
  - Tương tự, dùng `getExpenseAggregateBySubCategoryIds`
  - Vẫn giữ logic `calculatePeriodForMonth` cho từng record (đã fix ở BE-02)

---

### BE-05 — Sửa `BudgetRepository`: thêm `take` (LIMIT) cho history query

- **File sửa:** `src/modules/budget/repositories/budget.repository.ts`
- **Prisma thay đổi:** Không (index đã thêm ở DB-01)
- **Migration:** Không
- [x] Sửa `getCategoryBudgets`: thêm `take: query?.limit ?? 12` vào `findMany`
  ```typescript
  return this.prisma.budCategory.findMany({
    where: { userId, ...(query?.month && { month: query.month }) },
    orderBy: { month: 'desc' },
    take: query?.limit ?? 12,
  });
  ```
- [x] Sửa `getSubCategoryBudgets`: tương tự thêm `take: query?.limit ?? 12`

---

### BE-06 — Sửa `BudgetModule`: cập nhật providers nếu inject thêm dependency

- **File sửa:** `src/modules/budget/budget.module.ts`
- **Prisma thay đổi:** Không
- **Migration:** Không
- [x] Nếu BE-04 inject `TransactionRepository` trực tiếp: import `TransactionModule` và đảm bảo `TransactionRepository` được export từ `TransactionModule`
- [x] Kiểm tra không có circular dependency: `BudgetModule` → `TransactionModule` → không được import lại `BudgetModule`

---

## ✅ VERIFICATION

- [x] `npm run lint` — không có lỗi ESLint
- [x] `npm run build` — compile thành công
- [x] **BE-01**: `POST /api/v1/budgets/categories` với `budget: 0` → nhận `400 Bad Request`
- [x] **BE-02**: User có `startDayMonth = 31`, gọi `GET /api/v1/budgets/sub-categories?month=2025-01` → `period.endDate` là `28/02/2025`
- [x] **BE-04 + BE-05**: `GET /api/v1/budgets/categories?limit=3` → trả đúng 3 tháng gần nhất, sort DESC
- [x] **BE-04 + BE-05**: `GET /api/v1/budgets/categories` (không có limit) → trả tối đa 12 tháng
- [x] Kiểm tra user A không truy cập được budget của user B
