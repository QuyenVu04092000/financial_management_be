---
feature: [slug-feature-name]
status: In-Progress
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
---

# Task List: [Tên Feature]

## 🗄️ DATABASE

- [ ] **DB-01**: Cập nhật `src/prisma/schema.prisma`
  - [ ] Thêm model / cột mới
  - [ ] Chạy `npx prisma migrate dev --name [tên-migration]`
  - [ ] Chạy `npx prisma generate`

## 📦 BACKEND (BE)

- [ ] **BE-01**: Tạo DTO trong `src/common/dto/[feature]/[feature].dto.ts`
  - [ ] Request DTO (class-validator decorators)
  - [ ] Response DTO (constructor mapping từ Prisma model)
  - [ ] Export qua `src/common/dto/index.ts`

- [ ] **BE-02**: Tạo Repository `src/modules/[feature]/repositories/[feature].repository.ts`
  - [ ] Inject `PrismaService`
  - [ ] Các method: findById (với userId check), findMany, create, update, delete
  - [ ] Luôn filter theo `userId` để đảm bảo isolation

- [ ] **BE-03**: Tạo Service `src/modules/[feature]/services/[feature].service.ts`
  - [ ] Business logic
  - [ ] Dùng `PrismaUnitOfWorkService` nếu có nhiều write
  - [ ] Throw `NotFoundException` khi không tìm thấy record
  - [ ] Map sang DTO trước khi trả về

- [ ] **BE-04**: Tạo Controller `src/modules/[feature]/controllers/[feature].controller.ts`
  - [ ] Lấy `userId` từ `req.user.id` (JWT payload)
  - [ ] Wrap response trong `new NormalResponseDto(...)`
  - [ ] Dùng `@Public()` nếu route không cần auth

- [ ] **BE-05**: Wiring Module `src/modules/[feature]/[feature].module.ts`
  - [ ] Khai báo providers, imports (PrismaModule, các module phụ thuộc)
  - [ ] Export service nếu module khác cần dùng
  - [ ] Import vào `src/app.module.ts`

## ✅ VERIFICATION

- [ ] `npm run lint` — không có lỗi ESLint
- [ ] `npm run build` — compile thành công
- [ ] Test thủ công qua Insomnia/Postman với JWT token hợp lệ
- [ ] Kiểm tra user A không truy cập được data của user B
