# Auth Service Testing Guide

## Prerequisites
1. Start your NestJS server: `npm run start:dev`
2. Ensure your database is running and configured
3. Make sure you have some test users in your database

## Test Endpoints

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "phone": "1234567890",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": true
}
```

### 2. Login (Sign In)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success", 
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile (Protected Route)
```bash
# Replace YOUR_JWT_TOKEN with the token from login response
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890"
  }
}
```

### 4. Change Password (Protected Route)
```bash
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "oldPassword": "password123",
    "newPassword": "newpassword456", 
    "confirmPassword": "newpassword456"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": true
}
```

### 5. Logout (Protected Route)
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "User logged out successfully",
    "timestamp": "2025-08-17T12:30:45.123Z"
  }
}
```

## Error Test Cases

### 1. Login with Wrong Password
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": null
}
```

### 2. Login with Non-existent User
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9999999999",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Success", 
  "data": null
}
```

### 3. Register with Existing Phone
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "another@example.com",
    "phone": "1234567890",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "User Phone is exists"
}
```

### 4. Access Protected Route Without Token
```bash
curl -X GET http://localhost:3000/auth/profile
```

**Expected Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 5. Change Password with Wrong Old Password
```bash
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "oldPassword": "wrongoldpassword",
    "newPassword": "newpassword456",
    "confirmPassword": "newpassword456"
  }'
```

## Using Postman/Thunder Client

1. **Import Collection**: You can create a Postman collection with all these endpoints
2. **Environment Variables**: Set up variables for:
   - `baseUrl`: http://localhost:3000
   - `accessToken`: Store the JWT token from login response
3. **Authentication**: Use Bearer Token authentication for protected routes

## Using VS Code Thunder Client Extension

Create a `.http` file with these requests:

```http
### Register User
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "1234567890", 
  "password": "password123"
}

### Login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "phone": "1234567890",
  "password": "password123"
}

### Get Profile
GET http://localhost:3000/auth/profile
Authorization: Bearer {{accessToken}}

### Logout
POST http://localhost:3000/auth/logout
Authorization: Bearer {{accessToken}}
```
