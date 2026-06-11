# Feature Requirement: [Tên Feature]

> **Nguồn**: [Link Ticket / Tên PO]
> **Ngày tạo**: YYYY-MM-DD

## 1. Mục tiêu (Objective)

Cải thiện tính năng ngân sách.

## 2. Mô tả chi tiết (User Stories)

- **Story 1**: Là người dùng, tôi muốn mình có thể quản lý ngân sách của tôi trong tháng bắt đầu từ ngày bắt đầu của tháng mà tôi đã cài đặt trước đó.
- **Story 2**: Là người dùng, tôi muốn mình có thể xem lịch sử ngân sách của tôi trong quá khứ.

## 3. Business Logic & Edge Cases

- [ ] **Validation đầu vào:** field `budget` phải `> 0`; field `month` phải đúng format `YYYY-MM`; `categoryId` / `subCategoryId` phải là UUID hợp lệ và thuộc về user đang đăng nhập
- [ ] **Phân quyền (userId isolation):** mọi query đều filter theo `userId` từ JWT — không cho phép user A đọc/sửa/xoá budget của user B; `categoryId` và `subCategoryId` phải được verify ownership trước khi upsert
- [ ] **Upsert logic:** tạo mới nếu chưa có `(userId, categoryId/subCategoryId, month)`, cập nhật `budget` nếu đã tồn tại — không tạo duplicate
- [ ] **Tính period theo `startDayMonth`:** period của tháng `YYYY-MM` bắt đầu từ ngày `startDayMonth` của tháng đó đến ngày `startDayMonth - 1` của tháng sau; `totalExpense` phải được tính trong đúng window này, không phải từ ngày 1 đến cuối tháng calendar
- [ ] **Lịch sử ngân sách:** trả về danh sách các tháng đã có budget trong quá khứ, mỗi tháng kèm `totalExpense` thực tế trong period tương ứng; cần xác định có giới hạn N tháng gần nhất hay không
- [ ] **Xử lý không tìm thấy record:** trả `NotFoundException` khi get budget theo ID/subCategoryId mà không tồn tại; các API list trả array rỗng `[]`, không throw lỗi
- [ ] **Cascade khi xoá Category/SubCategory:** xoá Category sẽ cascade xoá toàn bộ `BudCategory` và `SubBudCategory` liên quan — cần xác định có cần cảnh báo user trước khi xoá không

## 5. Edge Cases Phát Hiện Qua Phân Tích Code

- [ ] **EC-01 — `startDayMonth` overflow tháng ngắn:** `calculatePeriodForMonth` tính `endDate = new Date(nextYear, nextMonth, startDayMonth - 1)`. Khi `startDayMonth = 31` và tháng tiếp theo chỉ có 28/30 ngày (ví dụ tháng 2), JS tự overflow sang tháng 3 → window tính expense bị lệch. Cần clamp về ngày cuối tháng thực tế nếu `startDayMonth` vượt quá số ngày của tháng đó.

- [ ] **EC-02 — Lịch sử budget thiếu pagination + thiếu index:** `BudCategory` và `SubBudCategory` không có `@@index([userId, month])` riêng. Query lịch sử nhiều tháng sẽ scan toàn bộ records của user. Cần clarify: lịch sử hiển thị bao nhiêu tháng? Có cần pagination không?

- [ ] **EC-03 — N+1 query khi xem lịch sử có `totalExpense`:** `getCategoryBudgets` hiện gọi `getTotalExpenseByCategory` cho từng budget một (Promise.all nhưng vẫn là N DB queries). Xem lịch sử 12 tháng × 10 categories = 120 queries/request. Cần thiết kế aggregate query nếu lịch sử có hiển thị spent.

- [ ] **EC-04 — Decimal `budget` không validate `> 0` ở DTO:** Nếu DTO thiếu `@Min(1)`, user có thể upsert budget âm — Prisma không có check constraint, tính % thực hiện sẽ cho kết quả vô nghĩa trên UI.

- [ ] **EC-05 — Xoá Category cascade mất budget history nhưng transaction vẫn còn:** `BudCategory → Category` dùng `onDelete: Cascade`, nhưng Transaction dùng `onDelete: SetNull` với SubCategory. Xoá category xoá sạch budget history tháng đó trong khi transaction thực tế vẫn tồn tại → báo cáo lịch sử mất dữ liệu không có cảnh báo. Cần clarify: có cho phép xoá category khi đã có budget/transaction không?

## 4. Ghi chú khác

[Các lưu ý về UI/UX hoặc tích hợp từ PO]
