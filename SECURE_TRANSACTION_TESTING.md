# 🔒 Secure Transaction API Testing Guide

## Prerequisites
1. Server running: `npm run start:dev`
2. Valid JWT token from login

## Authentication Required
⚠️ **TẤT CẢ endpoints transaction đều yêu cầu JWT token**

### 1. Login để lấy token
```bash
curl -X POST http://localhost:3080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "data": {
    "accessToken": "YOUR_JWT_TOKEN_HERE"
  }
}
```

### 2. Lấy tất cả transactions của user hiện tại
```bash
curl -X GET http://localhost:3080/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Tạo transaction mới
```bash
curl -X POST http://localhost:3080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mua cafe",
    "type": "EXPENSE",
    "amount": 50000,
    "category_id": "category-uuid",
    "sub_category_id": "sub-category-uuid"
  }'
```
**Note:** `user_id` tự động được gán từ JWT token, không cần truyền

### 4. Xem chi tiết 1 transaction
```bash
curl -X GET http://localhost:3080/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Cập nhật transaction
```bash
curl -X PUT http://localhost:3080/api/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mua cafe updated",
    "type": "EXPENSE", 
    "amount": 60000,
    "category_id": "category-uuid",
    "sub_category_id": "sub-category-uuid"
  }'
```

### 6. Xóa transaction (soft delete)
```bash
curl -X DELETE http://localhost:3080/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

### User Isolation (Cách ly dữ liệu user)
- ✅ Mỗi user chỉ xem được transactions của mình
- ✅ Không thể truy cập transaction của user khác
- ✅ `user_id` tự động gán từ JWT token

### Access Control
- ✅ Tất cả endpoints yêu cầu authentication
- ✅ ResourceOwnershipGuard kiểm tra ownership trước khi cho phép truy cập
- ✅ Tự động reject nếu user cố truy cập dữ liệu không phải của mình

## ❌ Security Test Cases

### 1. Truy cập transaction của user khác (sẽ bị từ chối)
```bash
# Thay OTHER_USER_TRANSACTION_ID = ID transaction của user khác
curl -X GET http://localhost:3080/api/transactions/OTHER_USER_TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected Response:** 403 Forbidden

### 2. Truy cập không có token (sẽ bị từ chối)
```bash
curl -X GET http://localhost:3080/api/transactions
```
**Expected Response:** 401 Unauthorized

### 3. Token không hợp lệ (sẽ bị từ chối)
```bash
curl -X GET http://localhost:3080/api/transactions \
  -H "Authorization: Bearer INVALID_TOKEN"
```
**Expected Response:** 401 Unauthorized

## Thunder Client / VS Code REST Client

```http
### Variables
@baseUrl = http://localhost:3080/api
@contentType = application/json

### Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: {{contentType}}

{
  "phone": "1234567890",
  "password": "password123"
}

### Extract token
@accessToken = {{login.response.body.data.accessToken}}

### Get all transactions
GET {{baseUrl}}/transactions
Authorization: Bearer {{accessToken}}

### Create transaction
POST {{baseUrl}}/transactions
Content-Type: {{contentType}}
Authorization: Bearer {{accessToken}}

{
  "name": "Secure transaction test",
  "type": "EXPENSE",
  "amount": 100000,
  "category_id": "your-category-id",
  "sub_category_id": "your-sub-category-id"
}

### Get transaction detail
GET {{baseUrl}}/transactions/TRANSACTION_ID
Authorization: Bearer {{accessToken}}

### Update transaction
PUT {{baseUrl}}/transactions/TRANSACTION_ID
Content-Type: {{contentType}}
Authorization: Bearer {{accessToken}}

{
  "name": "Updated secure transaction",
  "amount": 150000
}

### Delete transaction
DELETE {{baseUrl}}/transactions/TRANSACTION_ID
Authorization: Bearer {{accessToken}}
```
