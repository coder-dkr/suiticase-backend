# 🧳 Thangabali's Suitcase Marketplace Backend

A premium suitcase marketplace backend API built with Node.js, Express, MongoDB, and modern authentication practices. This system supports multi-role authentication (admin, seller, buyer) with OTP verification via email.

## 🔧 Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/suitcase-marketplace

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

3. **Database Setup**
   - Install and start MongoDB locally, or use MongoDB Atlas
   - The application will automatically connect to the database

4. **Start the Server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

5. **API Access**
   - Base URL: `http://localhost:5000/api`
   - Health Check: `GET /api/health`

## ✅ Completed Features

### 🔐 Authentication System
- [x] **Multi-role authentication** (admin, seller, buyer)
- [x] **OTP-based email verification** using Nodemailer
- [x] **JWT token-based authentication** with role-based access control
- [x] **Secure password hashing** using bcryptjs
- [x] **Email templates** for OTP and welcome messages

### 👤 User Management
- [x] **User registration** with email/password/role
- [x] **Email OTP verification** (real email sending)
- [x] **User login** with JWT token generation
- [x] **Resend OTP** functionality
- [x] **Admin user management** (view, delete users)

### 🧳 Product Management (Seller Only)
- [x] **CRUD operations** for suitcase products
- [x] **Product specifications** (height, width, material, rate, stock)
- [x] **Mark products as sold**
- [x] **Bulk rate updates** by material
- [x] **Seller dashboard** with statistics
- [x] **Pagination and filtering**

### 📦 Order Processing (Buyer Only)
- [x] **Place orders** with payment method selection
- [x] **Order history** with detailed information
- [x] **Order cancellation** (pending orders only)
- [x] **Stock management** (automatic updates)
- [x] **Buyer dashboard** with order statistics

### 🛡️ Admin Controls
- [x] **User management** (view, delete, update status)
- [x] **System dashboard** with comprehensive statistics
- [x] **System health monitoring**
- [x] **Role-based access control**

### 🔒 Security Features
- [x] **JWT authentication** with role verification
- [x] **Rate limiting** to prevent abuse
- [x] **Input validation** using Joi
- [x] **Error handling** middleware
- [x] **Helmet.js** for security headers
- [x] **CORS** configuration

## 🚀 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST /signup          - Register new user with OTP
POST /verify          - Verify email with OTP
POST /login           - User login
POST /resend-otp      - Resend verification OTP
```

### Seller Routes (`/api/seller`) - Requires Seller Role
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

### Order Routes (`/api/orders`) - Requires Buyer Role
```
POST /               - Place new order
GET  /               - Get buyer's orders (with pagination)
GET  /:id            - Get single order details
PATCH /:id/cancel    - Cancel pending order
GET  /dashboard/stats - Buyer dashboard statistics
```

### Admin Routes (`/api/admin`) - Requires Admin Role
```
GET  /users          - Get all users (with filters)
GET  /users/:id      - Get single user details
DELETE /users/:id    - Delete user and related data
PATCH /users/:id/status - Update user verification status
GET  /dashboard      - Admin dashboard with full statistics
GET  /system         - System health and metrics
```

## 🏗️ Architecture & Code Quality

### Clean Code Practices
- **Modular structure** with separate routes, models, and middleware
- **Proper error handling** with custom error middleware
- **Input validation** using Joi schemas
- **Async/await** pattern throughout
- **Consistent naming** conventions
- **Comprehensive logging** for debugging

### Security Implementation
- **JWT tokens** with expiration
- **Password hashing** with bcryptjs (salt rounds: 12)
- **Rate limiting** (100 requests per 15 minutes)
- **Input sanitization** and validation
- **Role-based access control** middleware
- **Secure email OTP** with expiration (10 minutes)

### Database Design
- **Proper indexing** for query optimization
- **Referential integrity** with population
- **Transaction support** for complex operations
- **Aggregation pipelines** for statistics
- **Schema validation** with Mongoose

## 🧪 Testing the API

### Sample User Registration Flow
1. **Register**: `POST /api/auth/signup`
   ```json
   {
     "email": "seller@example.com",
     "password": "password123",
     "role": "seller"
   }
   ```

2. **Verify OTP**: `POST /api/auth/verify`
   ```json
   {
     "email": "seller@example.com",
     "otp": "123456"
   }
   ```

3. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "seller@example.com",
     "password": "password123"
   }
   ```

### Authentication Header
Include JWT token in all protected routes:
```
Authorization: Bearer <your-jwt-token>
```

## 📧 Email Configuration

The application uses **Nodemailer** for sending real emails. Configure your email provider in the `.env` file:

### Gmail Configuration
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

### Email Features
- **OTP verification emails** with professional templates
- **Welcome emails** after successful verification
- **HTML templates** with responsive design
- **Error handling** for email failures

## 🔍 Advanced Features

### Bulk Operations
- **Bulk rate updates** by material type
- **Percentage or fixed amount** increases
- **Transaction support** for data consistency

### Dashboard Analytics
- **User statistics** by role and verification status
- **Product analytics** by material and status
- **Order metrics** with revenue calculations
- **Recent activity** tracking

### System Monitoring
- **Database connection** status
- **Memory usage** monitoring
- **Server uptime** tracking
- **Health check** endpoints

## 🚨 Error Handling

Comprehensive error handling for:
- **Validation errors** with detailed messages
- **Authentication failures** with appropriate status codes
- **Database errors** with user-friendly messages
- **Rate limiting** with retry-after headers
- **System errors** with proper logging

## 🧠 Implementation Notes

- **Clean separation of concerns** with dedicated middleware
- **Proper HTTP status codes** for all responses
- **Consistent API response format** across all endpoints
- **Environment-based configuration** for different deployments
- **Scalable architecture** ready for production use
- **Comprehensive logging** for debugging and monitoring

This backend provides a solid foundation for a premium suitcase marketplace with modern authentication, role-based access control, and comprehensive business logic implementation.