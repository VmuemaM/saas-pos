# SaaS POS System - Complete Point of Sale Solution

A comprehensive, multi-business point-of-sale system built with modern technologies for managing multiple shops, locations, inventory, accounting, and sales.

## 🎯 Key Features

### Multiple Business/Shops
- Set up unlimited businesses in the application
- Separate inventory and accounting information for each business
- Complete business isolation and data security

### Location & Storefront Management
- Create multiple locations/storefronts/warehouses per business
- Manage all locations simultaneously
- Track stocks, purchases, and sales separately by location
- Customize invoice layout and scheme per location

### User & Role Management
- Powerful user and role management system
- Predefined roles (Admin, Cashier, Manager, Accountant)
- Create custom roles with granular permissions
- Unlimited user creation with role assignment

### Contacts Management
- Manage customers and suppliers
- Mark contacts as customers, suppliers, or both
- View transaction history with contacts
- Track credit/debit balances
- Payment term management with due date alerts

### Product Management
- Single and variable products
- Product classification by Brand, Category, Sub-Category
- Multiple unit support
- SKU management with auto-generation
- Low stock alerts
- Auto-calculated selling price based on profit margin

### Purchase Management
- Easy purchase entry for multiple locations
- Paid/Due purchase tracking
- Discount and tax application
- Due payment notifications

### Sales & POS
- Simplified AJAX-based POS interface
- Default Walk-In-Customer support
- Add customers directly from POS
- Multiple payment options
- Draft and final invoice options
- Customizable invoice layouts

### Expense Management
- Easy expense entry and categorization
- Location-based expense tracking
- Comprehensive expense reports by category and location

### Reports
- Purchase & Sale Reports
- Tax Reports
- Contact/Ledger Reports
- Stock Reports
- Expense Reports
- Trending Products Analysis
- Multi-level drill-down capabilities

## 🛠 Technology Stack

- **Backend**: Node.js/Express.js
- **Frontend**: React.js + Redux
- **Database**: PostgreSQL
- **Authentication**: JWT + OAuth2
- **Real-time**: Socket.io
- **Payment Integration**: Stripe, PayPal
- **Reporting**: Chart.js, PDF generation
- **Deployment**: Docker, AWS/Heroku

## 📁 Project Structure

```
saas-pos/
├── backend/
│   ├── routes/
│   └── app.js
├── frontend/
│   ├── src/
│   └── package.json
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL >= 12
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/VmuemaM/saas-pos.git
cd saas-pos

# Copy environment file
cp .env.example .env

# Install dependencies
npm run install-all

# Start with Docker
docker-compose up
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📚 Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [Features Guide](./docs/FEATURES.md)
- [Setup Guide](./docs/SETUP.md)

## 📄 License

MIT License
