---
feature: budget-improvement
base_url: /api/v1
---

# API Documentation: Budget Improvement

> Tất cả response wrap trong `NormalResponseDto`: `{ "data": ... }`
> Auth: Bearer JWT — `userId` luôn lấy từ JWT payload, không nhận từ request.

---

## 1. Lấy danh sách Budget theo Category

**Endpoint**: `GET /api/v1/budgets/categories`
**Auth Required**: Yes

### Overview

API trả về danh sách các budget đã thiết lập theo category của user, sắp xếp từ tháng mới nhất đến cũ nhất. Mỗi record kèm `totalExpense` — tổng chi tiêu thực tế trong tháng đó — và `remainingBudget` được tính theo đúng period window dựa trên `startDayMonth` của user (không phải từ ngày 1 đến cuối tháng calendar). Nếu truyền `month`, chỉ trả về budget của tháng đó; nếu không truyền, trả về lịch sử N tháng gần nhất (default 12, tối đa 24).

### Query Parameters

| Param | Type | Required | Description |
|:---|:---|:---|:---|
| `month` | String | No | Filter theo tháng cụ thể, format `YYYY-MM` (ví dụ: `2025-01`) |
| `limit` | Number | No | Số tháng lịch sử muốn lấy. Default: `12`, max: `24` |

### cURL Example

```bash
curl -X GET "{{base_url}}/budgets/categories?limit=6" \
     -H "Authorization: Bearer {{token}}"
```

### Success Response (200)

| Field | Type | Description |
|:---|:---|:---|
| `data` | Array | Danh sách budget records |
| `data[].id` | String (UUID) | ID của budget record |
| `data[].categoryId` | String (UUID) | ID category |
| `data[].budget` | Number | Ngân sách đặt ra |
| `data[].month` | String | Tháng ngân sách, format `YYYY-MM` |
| `data[].totalExpense` | Number | Tổng chi tiêu thực tế trong period window |
| `data[].remainingBudget` | Number | `budget - totalExpense` (có thể âm nếu vượt budget) |

```json
{
  "data": [
    {
      "id": "uuid-1",
      "categoryId": "uuid-cat-1",
      "budget": 5000000,
      "month": "2025-06",
      "userId": "uuid-user",
      "totalExpense": 3200000,
      "remainingBudget": 1800000
    },
    {
      "id": "uuid-2",
      "categoryId": "uuid-cat-1",
      "budget": 4500000,
      "month": "2025-05",
      "userId": "uuid-user",
      "totalExpense": 4800000,
      "remainingBudget": -300000
    }
  ]
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `Month must be in format YYYY-MM` | Query param `month` sai format |
| 400 | `limit must not be less than 1` | `limit` < 1 |
| 401 | `Unauthorized` | Token không hợp lệ hoặc hết hạn |

---

## 2. Tạo / Cập nhật Budget theo Category (Upsert)

**Endpoint**: `POST /api/v1/budgets/categories`
**Auth Required**: Yes

### Overview

API tạo mới hoặc cập nhật ngân sách cho một category trong một tháng cụ thể. Hệ thống dùng logic upsert dựa trên unique key `(userId, categoryId, month)` — nếu đã tồn tại thì update `budget`, nếu chưa thì tạo mới — do đó client có thể gọi API này nhiều lần mà không lo duplicate. Trước khi upsert, hệ thống verify `categoryId` phải thuộc về user đang đăng nhập; nếu không sẽ throw `404`. Toàn bộ upsert + tính `totalExpense` được wrap trong một Prisma transaction.

### Request Payload

| Field | Type | Required | Description |
|:---|:---|:---|:---|
| `categoryId` | String (UUID) | Yes | ID category muốn đặt ngân sách (phải thuộc userId) |
| `budget` | Number | Yes | Số tiền ngân sách, phải `>= 1` |
| `month` | String | Yes | Tháng ngân sách, format `YYYY-MM` (ví dụ: `2025-06`) |

```json
{
  "categoryId": "uuid-cat-1",
  "budget": 5000000,
  "month": "2025-06"
}
```

### cURL Example

```bash
curl -X POST "{{base_url}}/budgets/categories" \
     -H "Authorization: Bearer {{token}}" \
     -H "Content-Type: application/json" \
     -d '{"categoryId": "uuid-cat-1", "budget": 5000000, "month": "2025-06"}'
```

### Success Response (201)

```json
{
  "data": {
    "id": "uuid-1",
    "categoryId": "uuid-cat-1",
    "budget": 5000000,
    "month": "2025-06",
    "userId": "uuid-user",
    "totalExpense": 3200000,
    "remainingBudget": 1800000
  }
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `budget must not be less than 1` | `budget` <= 0 |
| 400 | `Month must be in format YYYY-MM` | `month` sai format |
| 400 | `categoryId should not be empty` | Thiếu `categoryId` |
| 401 | `Unauthorized` | Token không hợp lệ |
| 404 | `Category not found` | `categoryId` không tồn tại hoặc không thuộc user |

---

## 3. Lấy danh sách Budget theo SubCategory

**Endpoint**: `GET /api/v1/budgets/sub-categories`
**Auth Required**: Yes

### Overview

API trả về danh sách các budget đã thiết lập theo sub-category của user, sắp xếp từ tháng mới nhất. Mỗi record kèm `totalExpense`, `remainingBudget`, và `period` — object chứa `startDate`, `endDate`, `label` được tính dựa trên `startDayMonth` của user (ví dụ: user cài ngày lương là 10 thì period tháng 6 là `10/6/2025 - 9/7/2025`). Hỗ trợ filter theo `month` hoặc lấy lịch sử N tháng qua `limit`.

### Query Parameters

| Param | Type | Required | Description |
|:---|:---|:---|:---|
| `month` | String | No | Filter theo tháng, format `YYYY-MM` |
| `limit` | Number | No | Số tháng lịch sử. Default: `12`, max: `24` |

### cURL Example

```bash
curl -X GET "{{base_url}}/budgets/sub-categories?month=2025-06" \
     -H "Authorization: Bearer {{token}}"
```

### Success Response (200)

| Field | Type | Description |
|:---|:---|:---|
| `data[].id` | String (UUID) | ID của budget record |
| `data[].subCategoryId` | String (UUID) | ID sub-category |
| `data[].budget` | Number | Ngân sách đặt ra |
| `data[].month` | String | Tháng ngân sách `YYYY-MM` |
| `data[].totalExpense` | Number | Tổng chi tiêu thực tế trong period window |
| `data[].remainingBudget` | Number | `budget - totalExpense` |
| `data[].period.startDate` | ISO String | Ngày bắt đầu period (theo `startDayMonth`) |
| `data[].period.endDate` | ISO String | Ngày kết thúc period |
| `data[].period.label` | String | Label dạng `"10/6/2025 - 9/7/2025"` |

```json
{
  "data": [
    {
      "id": "uuid-sub-bud-1",
      "subCategoryId": "uuid-subcat-1",
      "budget": 1000000,
      "month": "2025-06",
      "userId": "uuid-user",
      "totalExpense": 650000,
      "remainingBudget": 350000,
      "period": {
        "startDate": "2025-06-10T00:00:00.000Z",
        "endDate": "2025-07-09T23:59:59.999Z",
        "label": "10/6/2025 - 9/7/2025"
      }
    }
  ]
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `Month must be in format YYYY-MM` | Query param `month` sai format |
| 401 | `Unauthorized` | Token không hợp lệ |

---

## 4. Tạo / Cập nhật Budget theo SubCategory (Upsert)

**Endpoint**: `POST /api/v1/budgets/sub-categories`
**Auth Required**: Yes

### Overview

API tạo mới hoặc cập nhật ngân sách cho một sub-category trong một tháng. Hệ thống upsert theo unique key `(userId, subCategoryId, month)` và tự động resolve `categoryId` từ sub-category record trong DB — client không cần truyền `categoryId`. Trước khi upsert, hệ thống verify `subCategoryId` phải thuộc về user đang đăng nhập; nếu không tìm thấy sẽ throw `404`. Response kèm `period` object để client hiển thị đúng window thời gian tính ngân sách theo `startDayMonth` của user.

### Request Payload

| Field | Type | Required | Description |
|:---|:---|:---|:---|
| `subCategoryId` | String (UUID) | Yes | ID sub-category (phải thuộc userId) |
| `budget` | Number | Yes | Số tiền ngân sách, phải `>= 1` |
| `month` | String | Yes | Tháng ngân sách, format `YYYY-MM` |

```json
{
  "subCategoryId": "uuid-subcat-1",
  "budget": 1000000,
  "month": "2025-06"
}
```

### cURL Example

```bash
curl -X POST "{{base_url}}/budgets/sub-categories" \
     -H "Authorization: Bearer {{token}}" \
     -H "Content-Type: application/json" \
     -d '{"subCategoryId": "uuid-subcat-1", "budget": 1000000, "month": "2025-06"}'
```

### Success Response (201)

```json
{
  "data": {
    "id": "uuid-sub-bud-1",
    "subCategoryId": "uuid-subcat-1",
    "budget": 1000000,
    "month": "2025-06",
    "userId": "uuid-user",
    "totalExpense": 650000,
    "remainingBudget": 350000,
    "period": {
      "startDate": "2025-06-10T00:00:00.000Z",
      "endDate": "2025-07-09T23:59:59.999Z",
      "label": "10/6/2025 - 9/7/2025"
    }
  }
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `budget must not be less than 1` | `budget` <= 0 |
| 400 | `Month must be in format YYYY-MM` | `month` sai format |
| 400 | `subCategoryId should not be empty` | Thiếu `subCategoryId` |
| 401 | `Unauthorized` | Token không hợp lệ |
| 404 | `Sub-category not found` | `subCategoryId` không tồn tại hoặc không thuộc user |

---

## 5. Lấy Budget của một SubCategory theo tháng

**Endpoint**: `GET /api/v1/budgets/sub-categories/:subCategoryId`
**Auth Required**: Yes

### Overview

API lấy chi tiết budget của một sub-category cụ thể cho một tháng. Nếu không truyền `month`, hệ thống tự tính "tháng hiện tại" dựa trên `startDayMonth` của user — nếu hôm nay chưa đến `startDayMonth` thì trả về budget của tháng trước vì user vẫn đang trong period của tháng đó (ví dụ: hôm nay 5/6, `startDayMonth = 10` → trả budget tháng `2025-05`). Nếu không tìm thấy budget cho sub-category + month thì throw `NotFoundException`, không trả về null.

### Path Parameters

| Param | Type | Required | Description |
|:---|:---|:---|:---|
| `subCategoryId` | String (UUID) | Yes | ID của sub-category cần xem budget |

### Query Parameters

| Param | Type | Required | Description |
|:---|:---|:---|:---|
| `month` | String | No | Tháng cần lấy, format `YYYY-MM`. Nếu bỏ trống, tự tính tháng hiện tại theo `startDayMonth` |

### cURL Example

```bash
# Lấy budget tháng hiện tại (tự tính theo startDayMonth)
curl -X GET "{{base_url}}/budgets/sub-categories/uuid-subcat-1" \
     -H "Authorization: Bearer {{token}}"

# Lấy budget tháng cụ thể
curl -X GET "{{base_url}}/budgets/sub-categories/uuid-subcat-1?month=2025-05" \
     -H "Authorization: Bearer {{token}}"
```

### Success Response (200)

```json
{
  "data": {
    "id": "uuid-sub-bud-1",
    "subCategoryId": "uuid-subcat-1",
    "budget": 1000000,
    "month": "2025-06",
    "userId": "uuid-user",
    "totalExpense": 650000,
    "remainingBudget": 350000,
    "period": {
      "startDate": "2025-06-10T00:00:00.000Z",
      "endDate": "2025-07-09T23:59:59.999Z",
      "label": "10/6/2025 - 9/7/2025"
    }
  }
}
```

### Error Responses

| HTTP Status | Message | Mô tả |
|:---|:---|:---|
| 400 | `Month must be in format YYYY-MM` | Query param `month` sai format |
| 401 | `Unauthorized` | Token không hợp lệ |
| 404 | `Sub-category budget for subCategoryId: {id} and month: {month} is not found.` | Không tìm thấy budget record |
