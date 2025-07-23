# 🧳 Suitcase Backend Services

**Version:** 1.0.0  


## Overview

The backbone of Suitcase platform's digital infrastructure, providing:
- Secure user authentication & authorization
- Real-time data processing
- Scalable microservices architecture
- High-performance API endpoints

## 🚀 API Endpoints

### Authentication Routes (`/api/v1/auth`)
```
POST /signup          - Register new user with OTP
POST /verify          - Verify email with OTP
POST /login           - User login
POST /resend-otp      - Resend verification OTP
```

### Seller Routes (`/api/v1/seller`) - Requires Seller Role
```
POST /products        - Add new suitcase product
GET  /products        - Get seller's products (with pagination)
GET  /products/:id    - Get single product
PATCH /products/:id   - Update product
PATCH /products/:id/sold - Mark product as sold
DELETE /products/:id  - Delete product
PATCH /rates          - Bulk update rates by material
GET  /dashboard       - Seller dashboard statistics
```

### Order Routes (`/api/v1/orders`) - Requires Buyer Role
```
POST /               - Place new order
GET  /               - Get buyer's orders (with pagination)
GET  /:id            - Get single order details
PATCH /:id/cancel    - Cancel pending order
GET  /dashboard/stats - Buyer dashboard statistics
```

### Admin Routes (`/api/v1/admin`) - Requires Admin Role
```
GET  /users          - Get all users (with filters)
GET  /users/:id      - Get single user details
DELETE /users/:id    - Delete user and related data
PATCH /users/:id/status - Update user verification status
GET  /dashboard      - Admin dashboard with full statistics
GET  /system         - System health and metrics
```

## 🧪 Testing the API

### Sample User Registration Flow
1. **Register**: `POST /api/v1/auth/signup`
   ```json
   {
     "email": "seller@example.com",
     "password": "password123",
     "role": "seller"
   }
   ```

2. **Verify OTP**: `POST /api/v1/auth/verify`
   ```json
   {
     "email": "seller@example.com",
     "otp": "123456"
   }
   ```

3. **Login**: `POST /api/v1/auth/login`
   ```json
   {
     "email": "seller@example.com",
     "password": "password123"
   }
   ```
