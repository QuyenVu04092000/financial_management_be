# AI Prompt Library — Dino Financial BE

Dùng các prompt mẫu dưới đây để điều khiển Claude/Cursor làm việc trên codebase NestJS này.  
Copy-paste và điền thông tin vào chỗ `[...]`.

---

## 1. Phân tích Requirement

> Mục tiêu: Bắt đầu feature mới, yêu cầu AI rà soát logic trước khi code.

```
Hãy đọc file `docs/[tên-feature]/01_requirement.md` và liệt kê 5 edge-case
hoặc rủi ro logic mà PO chưa đề cập. Tập trung vào: validation đầu vào,
phân quyền userId, xử lý Decimal amount, và cascade DB.
```

---

## 2. Thiết kế Kỹ thuật

> Mục tiêu: AI soạn technical design dựa trên requirement.

```
Dựa trên `docs/[tên-feature]/01_requirement.md`, hãy soạn thảo nội dung
cho file `docs/[tên-feature]/02_technical_design.md`.

Yêu cầu:
- Vẽ Sequence Diagram bằng Mermaid (Client → Controller → Service → Repository → Prisma)
- Thiết kế DB: bảng mới hoặc cột thêm vào schema.prisma
- Liệt kê các Prisma relation cần dùng (include/select)
- Ghi chú nếu cần dùng PrismaUnitOfWorkService (transaction)
```

---

## 3. Thiết kế API

> Mục tiêu: AI viết spec API chuẩn cho source này.

```
Hãy đọc `docs/[tên-feature]/02_technical_design.md` và viết spec các API
cần thiết vào file `docs/[tên-feature]/04_api.md`.

Đảm bảo đầy đủ:
- Endpoint, method, auth required
- Overview mô tả logic nghiệp vụ (tối thiểu 3 câu)
- Bảng mô tả Request fields (type, required, mô tả)
- Ví dụ JSON request/response
- Bảng Error responses với HTTP status và message
- Response luôn wrap trong `{ data: ... }` (NormalResponseDto)
```

---

## 4. Lập kế hoạch Tasks

> Mục tiêu: AI chia nhỏ task để thực hiện từng bước.

```
Hãy phân tích `01_requirement.md`, `02_technical_design.md` và `04_api.md`
trong folder `docs/[tên-feature]/`. Sau đó lập danh sách task chi tiết vào
file `docs/[tên-feature]/03_task.md`.

Chia rõ phần BE. Mỗi task BE cần ghi rõ:
- File cần tạo/sửa (controller, service, repository, dto, module)
- Prisma schema thay đổi nếu có
- Migration cần chạy không
```

---

## 5. Thực hiện Code

> Mục tiêu: Yêu cầu AI code một task cụ thể.

```
Hãy xem `docs/[tên-feature]/03_task.md` và thực hiện Task ID `[BE-XX]`.

Tuân thủ:
- Spec API trong `docs/[tên-feature]/04_api.md`
- Architecture trong `docs/[tên-feature]/02_technical_design.md`
- Coding convention trong `docs/00_template/06_coding_convention.md`
- Sau khi code xong, chạy `npm run lint` và `npm run build` để kiểm tra
```

---

## 6. Review Code

> Mục tiêu: AI đóng vai Senior Reviewer soát lỗi.

```
Hãy đóng vai một Senior NestJS Developer, review các thay đổi hiện tại
dựa trên nội dung Task `[copy nội dung task hoặc chỉ định file 03_task.md]`.

Công việc cần làm:
1. Kiểm tra có bám sát spec trong 04_api.md không
2. Kiểm tra lỗi logic, khả năng crash, bảo mật (userId isolation — không để user A truy cập data user B)
3. Kiểm tra có dùng đúng pattern: NormalResponseDto, repository layer, UoW khi cần transaction

Output theo format:
- Đoạn code: [file:dòng]
- Vấn đề & Giải pháp: [mô tả]
- Mức độ: [Nghiêm trọng | Cần sửa | Góp ý]

Kết luận: Pass hay Needs Changes.
```

---

## 7. Release Plan

> Mục tiêu: Tổng hợp migration và ENV mới trước khi lên production.

```
Hãy tổng hợp lại toàn bộ thay đổi Prisma schema, migration scripts cần chạy,
và các biến ENV mới phát sinh trong quá trình code feature `[tên-feature]`
vào file `docs/[tên-feature]/05_release_plan.md`.
```
