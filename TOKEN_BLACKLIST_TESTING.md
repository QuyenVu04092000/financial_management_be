# 🔒 Token Blacklisting Test Guide

## Test Secure Logout với Token Invalidation

### Prerequisites
1. Server running: `npm run start:dev`
2. User đã được tạo trong database

### Test Flow: Token Blacklisting

#### 1. Login để lấy JWT token
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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Test Profile với token (TRƯỚC logout) - Should work ✅
```bash
curl -X GET http://localhost:3080/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** 200 OK với thông tin profile

#### 3. Logout để blacklist token
```bash
curl -X POST http://localhost:3080/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected Response:**
```json
{
  "data": {
    "message": "User logged out successfully. Token has been invalidated.",
    "timestamp": "2025-08-17T..."
  }
}
```

#### 4. Test Profile với SAME token (SAU logout) - Should fail ❌
```bash
curl -X GET http://localhost:3080/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** 401 Unauthorized với message "Token has been invalidated"

### Thunder Client Test

```http
### Variables
@baseUrl = http://localhost:3080/api
@contentType = application/json

### 1. Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: {{contentType}}

{
  "phone": "1234567890",
  "password": "password123"
}

### Extract token
@accessToken = {{login.response.body.data.accessToken}}

### 2. Get Profile BEFORE logout (should work)
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{accessToken}}

### 3. Logout (blacklist token)
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}

### 4. Get Profile AFTER logout (should fail)
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{accessToken}}

### 5. Try to access transactions (should also fail)
GET {{baseUrl}}/transactions
Authorization: Bearer {{accessToken}}
```

## 🔒 Security Improvements

### What Changed:
1. **Token Blacklisting**: Logout bây giờ thêm token vào blacklist
2. **JWT Guard Enhancement**: Kiểm tra blacklist trước khi validate token
3. **Memory Management**: Tự động xóa expired tokens khỏi blacklist
4. **Real Logout**: Token thực sự bị vô hiệu hóa sau logout

### Benefits:
- ✅ **Secure Logout**: Token không thể dùng lại sau logout
- ✅ **Immediate Invalidation**: Có hiệu lực ngay lập tức
- ✅ **Memory Efficient**: Tự động cleanup expired tokens
- ✅ **Session Security**: Ngăn chặn session hijacking

### Production Considerations:
- **Redis**: Nên thay in-memory cache bằng Redis cho production
- **Clustering**: Multiple server instances cần shared blacklist
- **Performance**: Monitor blacklist size và cleanup frequency

## Comparison: Before vs After

### Before (Insecure):
```
1. Login → Get Token
2. Use Token → ✅ Works
3. Logout → ✅ Success (but token still valid)
4. Use Same Token → ✅ Still works (SECURITY ISSUE!)
```

### After (Secure):
```
1. Login → Get Token
2. Use Token → ✅ Works
3. Logout → ✅ Success + Token blacklisted
4. Use Same Token → ❌ "Token has been invalidated"
```
