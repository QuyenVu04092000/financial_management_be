# Hướng dẫn sử dụng Template Docs — Dino Financial BE

Bộ template này đồng bộ hóa quy trình làm việc giữa Dev và AI (Claude/Cursor)
trên codebase NestJS này.

## Cách bắt đầu một Feature mới

1. Tạo thư mục mới trong `/docs` với tên feature (ví dụ: `/docs/recurring-transaction`)
2. Copy toàn bộ file từ `/docs/00_template/` vào thư mục vừa tạo
3. Điền thông tin vào từng file theo thứ tự số

## Cấu trúc và ý nghĩa các file

| File | Ai dùng | Mục đích |
|:---|:---|:---|
| `00_ai_prompts.md` | Dev | Thư viện prompt mẫu để điều khiển AI |
| `01_requirement.md` | Dev / AI | Yêu cầu gốc từ PO — AI đọc để hiểu context |
| `02_technical_design.md` | Dev / AI | Thiết kế kỹ thuật: Mermaid flow, DB schema, dependencies |
| `03_task.md` | **AI (Priority)** | Danh sách task BE — AI cập nhật trạng thái khi code |
| `04_api.md` | **AI (Priority)** | Spec API đầy đủ — AI tuân thủ khi implement |
| `05_release_plan.md` | Dev / DevOps | Migration scripts và ENV cần thiết khi release |
| `06_coding_convention.md` | **AI** | Patterns bắt buộc — AI đọc trước khi code bất kỳ task nào |

## Workflow nhanh

```
01_requirement → 02_technical_design → 04_api → 03_task → CODE → Review → 05_release_plan
```

Dùng các prompt trong `00_ai_prompts.md` để chuyển tiếp giữa các bước.
