# 🪑 Furniture Shop

A full-stack e-commerce web application for a furniture shop.

The system provides two main panels:

- Customer Panel
- Admin Panel

Customers can browse furniture, manage their cart and wishlist, place orders, make payments, and track their orders.

Admins can manage products, categories, inventory, customers, and orders through an admin dashboard.

---

## 🚀 Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM

### Database
- PostgreSQL
- Supabase

### Authentication
- JWT Authentication
- Email & Password Login
- Google OAuth 2.0

### Storage
- Supabase Storage

---

# 👤 Customer Panel

The Customer Panel allows customers to browse and purchase furniture online.

## Customer Features

### Authentication
- Customer Registration
- Customer Login
- Google Login
- JWT Authentication
- Change Password

### Profile Management
- View Profile
- Update Profile
- Manage Phone Number
- Manage Delivery Addresses

### Product Browsing
- View Furniture Products
- View Product Details
- Browse Products by Category
- Search Products
- Filter Products
- View Product Images
- View Price and Stock Availability

### Wishlist
- Add Product to Wishlist
- Remove Product from Wishlist
- View Wishlist

### Shopping Cart
- Add Product to Cart
- Remove Product from Cart
- Update Product Quantity
- View Cart
- View Cart Total

### Orders
- Place Order
- View My Orders
- View Order Details
- Cancel Eligible Orders
- Track Order Status

### Payments
- Online Payment
- Payment Status
- Order Payment History

### Reviews
- Add Product Review
- Give Product Rating
- View Product Reviews

---

# 🛠️ Admin Panel

The Admin Panel allows the furniture shop administrator to manage the complete store.

## Admin Features

### Admin Authentication
- Admin Login
- JWT Authentication
- Role-Based Authorization

### Dashboard
- Total Customers
- Total Products
- Total Orders
- Total Sales
- Recent Orders
- Order Status Summary

### Product Management
- Add Product
- Update Product
- Delete Product
- View Products
- Upload Product Images
- Manage Product Price
- Manage Product Stock

### Category Management
- Add Category
- Update Category
- Delete Category
- View Categories

Example categories:

- Sofa
- Bed
- Chair
- Table
- Wardrobe
- Dining Furniture
- Office Furniture

### Order Management
- View All Orders
- View Order Details
- Confirm Orders
- Update Order Status
- Cancel Orders

Possible order statuses:

- Pending
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled

### Customer Management
- View Customers
- View Customer Details
- Activate/Deactivate Customer Accounts

### Inventory Management
- View Product Stock
- Update Stock
- Monitor Out-of-Stock Products

### Review Management
- View Customer Reviews
- Remove Inappropriate Reviews

---

# 🔐 User Roles

The application currently supports two roles:

```text
CUSTOMER
ADMIN
```

Role-based authorization is used to protect Admin APIs and Customer APIs.

---

# 📁 Project Structure

```text
furniture-shop/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── generated/
│   │   └── app.ts
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── frontend/
│   └── Coming Soon
│
└── README.md
```

---

# 🔄 Customer Workflow

```text
Register / Login
       ↓
Browse Furniture
       ↓
View Product
       ↓
Add to Wishlist / Cart
       ↓
Manage Cart
       ↓
Select Delivery Address
       ↓
Place Order
       ↓
Payment
       ↓
Order Confirmation
       ↓
Track Order
       ↓
Delivery
       ↓
Review Product
```

---

# 🔄 Admin Workflow

```text
Admin Login
      ↓
Admin Dashboard
      ↓
Manage Categories
      ↓
Manage Products
      ↓
Manage Inventory
      ↓
Receive Customer Orders
      ↓
Process Orders
      ↓
Update Order Status
      ↓
Monitor Sales
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

DATABASE_URL=
DIRECT_URL=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

> Never commit the `.env` file to GitHub.

---

# ⚙️ Backend Installation

Clone the repository:

```bash
git clone <repository-url>
```

Move into the backend:

```bash
cd furniture-shop/backend
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

---

# 📡 Current APIs

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

## Customer Profile

```text
GET /api/users/profile
PUT /api/users/profile
```

Protected APIs require a JWT:

```text
Authorization: Bearer <token>
```

---

# 📌 Development Status

### Completed

- Backend project setup
- Express + TypeScript setup
- PostgreSQL database connection
- Prisma ORM setup
- Database migrations
- Customer registration
- Customer login
- Password hashing
- JWT authentication
- Authentication middleware
- Get customer profile
- Update customer profile

### Planned

- Google OAuth 2.0
- Change Password
- Customer Address Management
- Product Management
- Category Management
- Product Image Upload
- Wishlist
- Shopping Cart
- Order Management
- Payment Integration
- Order Tracking
- Reviews & Ratings
- Admin Dashboard
- Inventory Management
- Frontend Customer Panel
- Frontend Admin Panel

---

# 🔒 Security

The application uses:

- Password hashing with bcrypt
- JWT-based authentication
- Role-based authorization
- Environment variables for sensitive credentials
- Protected API routes
- Request validation

Sensitive information such as database passwords, JWT secrets, Google OAuth credentials, and Supabase keys must never be committed to GitHub.

---

# 📄 License

This project is developed for a furniture shop e-commerce platform.
