---
feature: [slug-feature-name]
base_url: /api/v1
---

# API Documentation: [Tên Feature]

> Tất cả response đều wrap trong `NormalResponseDto`: `{ "data": ... }`
> Auth: Bearer JWT token (trừ route có `@Public()`)

---

## 1. [Tên API — Ví dụ: Tạo mới resource]

**Endpoint**: `POST /api/v1/[resources]`
**Auth Required**: Yes

### Overview

[Mô tả logic nghiệp vụ của API này. Ví dụ: API tạo mới một giao dịch tài chính cho user.
Hệ thống sẽ validate subCategoryId thuộc về userId, sau đó wrap create + update balance
trong một Prisma transaction. Amount phải là số dương, type là "in" hoặc "out".]

### cURL Example

```bash
curl -X POST "{{base_url}}/[resources]" \
     -H "Authorization: Bearer {{token}}" \
     -H "Content-Type: application/json" \
     -d '{
       "field1": "value1",
       "amount": 50000
     }'
```

### Request Payload

| Field | Type | Required | Description |
|:---|:---|:---|:---|
| `field1` | String | Yes | Mô tả field |
| `amount` | Number | Yes | Số tiền (dương, Decimal 18,2) |
| `type` | Enum | Yes | `"in"` hoặc `"out"` |

```json
{
  "field1": "value1",
  "amount": 50000,
  "type": "out"
}
```

### Success Response (201)

| Field | Type | Description |
|:---|:---|:---|
| `data` | Object | Resource vừa tạo |
| `data.id` | String (UUID) | ID duy nhất |
| `data.createdAt` | ISO String | Thời gian tạo (UTC) |

```json
{
  "data": {
    "id": "uuid-here",
    "field1": "value1",
    "amount": "50000.00",
    "type": "out",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `Bad Request` | Payload thiếu field bắt buộc hoặc sai format |
| 401 | `Unauthorized` | Token không hợp lệ hoặc hết hạn |
| 404 | `[Resource] not found` | Không tìm thấy record theo ID |

---

## 2. [Tên API tiếp theo — Ví dụ: Lấy danh sách]

**Endpoint**: `GET /api/v1/[resources]`
**Auth Required**: Yes

### Overview

[Mô tả logic...]

### Query Parameters

| Param | Type | Required | Description |
|:---|:---|:---|:---|
| `startDate` | ISO Date String | Yes | Từ ngày |
| `endDate` | ISO Date String | Yes | Đến ngày |

### Success Response (200)

```json
{
  "data": [
    {
      "id": "uuid",
      "amount": "50000.00"
    }
  ]
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `startDate and endDate are required` | Thiếu date filter |
