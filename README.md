# Finaya - Financial Management & Business Intelligence Platform

Finaya is a comprehensive financial management and business location strategist platform designed to help businesses optimize their financial operations and make data-driven location strategy decisions.

## 🚀 Features

### Core Modules

#### 💰 Financial Management
- **Transaction Management**: Track and categorize all business transactions
- **Expense Management**: Monitor and analyze business expenses
- **Document Management**: Handle receipts, invoices, and financial documents
- **Report Generation**: Create comprehensive financial reports
- **Audit Logging**: Complete audit trail for compliance

#### 📍 Business Location Strategist
- **Location Analysis**: Analyze potential business locations
- **Profitability Assessment**: Evaluate location profitability metrics
- **Map Services Integration**: Interactive mapping and location services
- **Market Analysis**: Understand local market conditions

#### 📊 Business Planning
- **Business Plan Creation**: Develop comprehensive business plans
- **Financial Projections**: Create accurate financial forecasts
- **Expense Planning**: Strategic expense management
- **Performance Tracking**: Monitor business plan execution

#### 🤖 AI Advisor
- **Smart Insights**: AI-powered business insights
- **Recommendations**: Data-driven recommendations
- **Predictive Analytics**: Future trend analysis

## 🛠 Technology Stack

### Backend
- **Framework**: Python FastAPI
- **Database**: Configurable database support
- **Authentication**: Secure user authentication system
- **File Processing**: PDF, Excel, CSV, DOCX, Image handling
- **Task Queue**: Celery for background processing
- **Cloud Integration**: Huawei Cloud services integration

### Frontend
- **Framework**: Next.js with TypeScript
- **UI Components**: Custom component library
- **State Management**: Zustand stores
- **Internationalization**: Multi-language support (EN, ID, TH, VI, TL, JA, KO)
- **Styling**: Tailwind CSS

### Infrastructure
- **Containerization**: Docker support
- **Deployment**: Production-ready deployment configuration
- **Testing**: Comprehensive test suite
- **Documentation**: Complete API and architecture documentation

## 🌐 Multi-Language Support

Finaya supports multiple languages to serve diverse markets:
- English (EN)
- Indonesian (ID)
- Thai (TH)
- Vietnamese (VI)
- Tagalog (TL)
- Japanese (JA)
- Korean (KO)

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker (optional)

### Backend Setup
```bash
cd backend
# Install dependencies
pip install -r requirements.txt
# or use Poetry
poetry install

# Edit .env with your configuration

# Initialize database
python scripts/init_db.py

# Run the application
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Run development server
npm run dev
```

### Docker Setup (Alternative)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📁 Project Structure

```
finaya/
├── 📄 LICENSE                    # All Rights Reserved license
├── 📄 README.md                  # Project documentation
├── 📁 backend/                   # Python FastAPI backend
│   ├── 📄 Dockerfile            # Container configuration
│   ├── 📄 pyproject.toml        # Python project configuration
│   ├── 📄 poetry.lock           # Dependency lock file
│   ├── 📁 requirements/          # Environment-specific dependencies
│   │   ├── base.txt             # Base requirements
│   │   ├── dev.txt              # Development requirements
│   │   ├── prod.txt             # Production requirements
│   │   └── test.txt             # Testing requirements
│   ├── 📁 app/                  # Main application package
│   │   ├── 📄 main.py           # FastAPI application entry point
│   │   ├── 📄 config.py         # Application configuration
│   │   ├── 📄 database.py       # Database connection setup
│   │   ├── 📄 dependencies.py   # FastAPI dependencies
│   │   ├── 📁 api/              # API route definitions
│   │   │   └── v1/              # API version 1
│   │   │       ├── 📄 api.py    # Main API router
│   │   │       └── 📁 routers/  # Feature-specific routers
│   │   │           ├── auth.py  # Authentication endpoints
│   │   │           ├── users.py # User management
│   │   │           ├── health.py # Health check
│   │   │           ├── notifications.py # Notifications
│   │   │           ├── analytics.py # Analytics endpoints
│   │   │           └── financial_management/ # Financial module
│   │   │               ├── workspaces.py # Workspace management
│   │   │               ├── transactions.py # Transaction handling
│   │   │               ├── documents.py # Document management
│   │   │               ├── categories.py # Category management
│   │   │               ├── reports.py # Report generation
│   │   │               └── audit_logs.py # Audit logging
│   │   │           └── business_location_strategist/ # Location module
│   │   │               ├── locations.py # Location management
│   │   │               ├── analyses.py # Location analysis
│   │   │               ├── profitability.py # Profitability metrics
│   │   │               └── map_services.py # Map integration
│   │   │           └── business_planning/ # Planning module
│   │   │               ├── plans.py # Business plan management
│   │   │               ├── projections.py # Financial projections
│   │   │               └── expenses.py # Expense planning
│   │   │           └── advisor/ # AI advisor module
│   │   │               ├── insights.py # AI insights
│   │   │               └── recommendations.py # AI recommendations
│   │   ├── 📁 core/             # Core functionality
│   │   │   ├── security.py      # Security utilities
│   │   │   ├── permissions.py   # Permission management
│   │   │   ├── rate_limiter.py  # Rate limiting
│   │   │   ├── exceptions.py    # Custom exceptions
│   │   │   └── middleware.py    # Custom middleware
│   │   ├── 📁 models/           # Database models
│   │   │   ├── base.py          # Base model class
│   │   │   ├── mixins.py        # Model mixins
│   │   │   ├── user.py          # User model
│   │   │   ├── session.py       # Session model
│   │   │   ├── payment_method.py # Payment method model
│   │   │   └── financial_management/ # Financial models
│   │   │       ├── workspace.py # Workspace model
│   │   │       ├── transaction.py # Transaction model
│   │   │       ├── document.py  # Document model
│   │   │       ├── category.py  # Category model
│   │   │       ├── report.py    # Report model
│   │   │       ├── report_item.py # Report item model
│   │   │       └── audit_log.py # Audit log model
│   │   │   └── business_location_strategist/ # Location models
│   │   │       ├── location_analysis.py # Location analysis model
│   │   │       ├── location_detail.py # Location detail model
│   │   │       └── profitability_metric.py # Profitability model
│   │   │   └── business_planning/ # Planning models
│   │   │       ├── business_plan.py # Business plan model
│   │   │       ├── financial_projection.py # Projection model
│   │   │       └── business_expense.py # Expense model
│   │   │   └── advisor/         # Advisor models
│   │   │       └── recommendation.py # Recommendation model
│   │   ├── 📁 schemas/          # Pydantic schemas
│   │   │   ├── auth.py          # Authentication schemas
│   │   │   ├── user.py          # User schemas
│   │   │   ├── common.py        # Common schemas
│   │   │   ├── health.py        # Health schemas
│   │   │   ├── notification.py  # Notification schemas
│   │   │   ├── analytics.py     # Analytics schemas
│   │   │   └── financial_management/ # Financial schemas
│   │   │       ├── workspace.py # Workspace schemas
│   │   │       ├── transaction.py # Transaction schemas
│   │   │       ├── document.py  # Document schemas
│   │   │       ├── category.py  # Category schemas
│   │   │       ├── report.py    # Report schemas
│   │   │       └── audit_logs.py # Audit log schemas
│   │   │   └── business_location_strategist/ # Location schemas
│   │   │       ├── location.py  # Location schemas
│   │   │       ├── analysis.py  # Analysis schemas
│   │   │       └── profitability.py # Profitability schemas
│   │   │   └── business_planning/ # Planning schemas
│   │   │       ├── plan.py      # Plan schemas
│   │   │       ├── projection.py # Projection schemas
│   │   │       └── expenses.py  # Expense schemas
│   │   │   └── advisor/         # Advisor schemas
│   │   │       ├── recommendation.py # Recommendation schemas
│   │   │       └── insights.py  # Insight schemas
│   │   ├── 📁 services/         # Business logic services
│   │   │   ├── auth_service.py  # Authentication service
│   │   │   ├── user_service.py  # User service
│   │   │   ├── notification_service.py # Notification service
│   │   │   ├── huawei_ai_service.py # Huawei AI service
│   │   │   ├── base_service.py  # Base service class
│   │   │   └── financial_management/ # Financial services
│   │   │       ├── workspace_service.py # Workspace service
│   │   │       ├── document_service.py # Document service
│   │   │       ├── transaction_service.py # Transaction service
│   │   │       ├── report_service.py # Report service
│   │   │       └── audit_service.py # Audit service
│   │   │   └── business_location_strategist/ # Location services
│   │   │       ├── location_service.py # Location service
│   │   │       ├── analysis_service.py # Analysis service
│   │   │       ├── profitability_service.py # Profitability service
│   │   │       └── map_service.py # Map service
│   │   │   └── business_planning/ # Planning services
│   │   │       ├── plan_service.py # Plan service
│   │   │       └── projection_service.py # Projection service
│   │   │   └── advisor/         # Advisor services
│   │   │       ├── recommendation_service.py # Recommendation service
│   │   │       └── insight_service.py # Insight service
│   │   ├── 📁 integrations/     # External integrations
│   │   │   ├── huawei/          # Huawei Cloud services
│   │   │   │   ├── base_client.py # Base Huawei client
│   │   │   │   ├── obs_client.py # Object Storage Service
│   │   │   │   ├── modelarts_client.py # AI Model Service
│   │   │   │   ├── pangu_client.py # Pangu AI Service
│   │   │   │   ├── smn_client.py # Simple Message Notification
│   │   │   │   └── cts_client.py # Cloud Trace Service
│   │   │   └── third_party/     # Third-party integrations
│   │   │       └── email_service.py # Email service
│   │   ├── 📁 utils/            # Utility functions
│   │   │   ├── validators.py    # Data validation utilities
│   │   │   ├── formatters.py    # Data formatting utilities
│   │   │   ├── calculations.py  # Financial calculations
│   │   │   ├── helpers.py       # General helper functions
│   │   │   ├── constants.py     # Application constants
│   │   │   ├── file_handlers/   # File processing utilities
│   │   │   │   ├── pdf_handler.py # PDF processing
│   │   │   │   ├── excel_handler.py # Excel processing
│   │   │   │   ├── csv_handler.py # CSV processing
│   │   │   │   ├── docx_handler.py # Word document processing
│   │   │   │   └── image_handler.py # Image processing
│   │   │   └── generators/      # File generation utilities
│   │   │       ├── pdf_generator.py # PDF generation
│   │   │       └── excel_generator.py # Excel generation
│   │   ├── 📁 repositories/     # Data access layer
│   │   │   ├── base_repository.py # Base repository class
│   │   │   ├── user_repository.py # User repository
│   │   │   ├── transaction_repository.py # Transaction repository
│   │   │   ├── location_repository.py # Location repository
│   │   │   └── report_repository.py # Report repository
│   │   ├── 📁 tasks/            # Background tasks
│   │   │   ├── celery_app.py    # Celery configuration
│   │   │   ├── email_tasks.py   # Email processing tasks
│   │   │   ├── ai_processing_tasks.py # AI processing tasks
│   │   │   └── report_generation_tasks.py # Report generation tasks
│   │   ├── 📁 storage/          # File storage
│   │   │   ├── uploads/         # File uploads directory
│   │   │   ├── temp/            # Temporary files
│   │   │   └── exports/         # Export files
│   │   └── 📁 docs/             # Documentation
│   │       ├── architecture.md  # Architecture documentation
│   │       ├── deployment.md    # Deployment guide
│   │       ├── huawei_setup.md  # Huawei setup instructions
│   │       └── api/             # API documentation
│   ├── 📁 scripts/              # Database and utility scripts
│   │   ├── init_db.py           # Database initialization
│   │   ├── seed_data.py         # Sample data seeding
│   │   ├── migrate_data.py      # Data migration
│   │   └── cleanup.py           # Cleanup utilities
│   ├── 📁 tests/                # Test suite
│   │   ├── conftest.py          # Test configuration
│   │   ├── test_auth.py         # Authentication tests
│   │   ├── test_users.py        # User tests
│   │   └── test_transactions.py # Transaction tests
│   ├── 📄 .env                  # Environment variables
│   ├── 📄 .gitignore            # Git ignore file
│   └── 📄 CONTRIBUTING.md       # Contributing guidelines
├── 📁 frontend/                 # Next.js frontend application
│   ├── 📄 .gitignore            # Git ignore file
│   ├── 📄 package.json          # Node.js dependencies
│   ├── 📄 package-lock.json     # Dependency lock file
│   ├── 📄 next.config.ts        # Next.js configuration
│   ├── 📄 tsconfig.json         # TypeScript configuration
│   ├── 📄 eslint.config.mjs     # ESLint configuration
│   ├── 📄 postcss.config.mjs    # PostCSS configuration
│   ├── 📄 components.json       # UI components configuration
│   ├── 📄 middleware.ts         # Next.js middleware
│   ├── 📁 src/
│   │   ├── 📄 layout.tsx        # Root layout
│   │   ├── 📄 page.tsx          # Home page
│   │   ├── 📄 globals.css       # Global styles
│   │   ├── 📁 app/              # Next.js app router
│   │   │   ├── (auth)/          # Authentication pages
│   │   │   │   ├── login/       # Login page
│   │   │   │   └── register/    # Registration page
│   │   │   └── (dashboard)/     # Dashboard pages
│   │   │       ├── dashboard/   # Main dashboard
│   │   │       ├── location/    # Location analysis
│   │   │       ├── analytics/   # Analytics dashboard
│   │   │       ├── expenses/    # Expense management
│   │   │       └── settings/    # User settings
│   │   ├── 📁 components/       # React components
│   │   │   ├── ui/              # Reusable UI components
│   │   │   │   ├── button.tsx   # Button component
│   │   │   │   ├── input.tsx    # Input component
│   │   │   │   ├── select.tsx   # Select component
│   │   │   │   ├── dialog.tsx   # Dialog component
│   │   │   │   ├── sheet.tsx    # Sheet component
│   │   │   │   ├── skeleton.tsx # Skeleton loader
│   │   │   │   └── badge.tsx    # Badge component
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── Header.tsx   # Site header
│   │   │   │   ├── Sidebar.tsx  # Navigation sidebar
│   │   │   │   └── Footer.tsx   # Site footer
│   │   │   ├── landing/         # Landing page components
│   │   │   │   ├── Hero.tsx     # Hero section
│   │   │   │   ├── ProblemSection.tsx # Problem statement
│   │   │   │   ├── SolutionSection.tsx # Solution showcase
│   │   │   │   ├── HowItWorks.tsx # How it works
│   │   │   │   ├── ImpactSection.tsx # Impact demonstration
│   │   │   │   ├── CTASection.tsx # Call to action
│   │   │   │   └── LandingFooter.tsx # Footer
│   │   │   ├── auth/            # Authentication components
│   │   │   │   ├── LoginForm.tsx # Login form
│   │   │   │   ├── RegisterForm.tsx # Registration form
│   │   │   │   └── SocialLogin.tsx # Social login
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   │   ├── StatsCard.tsx # Statistics card
│   │   │   │   ├── RevenueChart.tsx # Revenue chart
│   │   │   │   ├── ExpenseChart.tsx # Expense chart
│   │   │   │   ├── CashflowChart.tsx # Cash flow chart
│   │   │   │   ├── PerformanceGauge.tsx # Performance gauge
│   │   │   │   └── RegionalComparison.tsx # Regional comparison
│   │   │   ├── location/        # Location analysis components
│   │   │   │   ├── MapView.tsx  # Map visualization
│   │   │   │   ├── LocationSelector.tsx # Location selector
│   │   │   │   ├── AnalysisForm.tsx # Analysis form
│   │   │   │   ├── ProfitabilityCard.tsx # Profitability display
│   │   │   │   ├── AreaAnalysisChart.tsx # Area analysis chart
│   │   │   │   └── RevenueProjection.tsx # Revenue projection
│   │   │   ├── finance/         # Financial management components
│   │   │   │   ├── ExpenseForm.tsx # Expense entry form
│   │   │   │   ├── TransactionList.tsx # Transaction list
│   │   │   │   ├── TransactionCard.tsx # Transaction card
│   │   │   │   ├── ReceiptUpload.tsx # Receipt upload
│   │   │   │   ├── CategorySelector.tsx # Category selector
│   │   │   │   └── ExpenseSummary.tsx # Expense summary
│   │   │   └── common/          # Common/shared components
│   │   │       ├── LanguageSelector.tsx # Language selector
│   │   │       ├── CurrencySelector.tsx # Currency selector
│   │   │       ├── CountrySelector.tsx # Country selector
│   │   │       ├── LoadingSpinner.tsx # Loading spinner
│   │   │       ├── ErrorMessage.tsx # Error message display
│   │   │       └── Pagination.tsx # Pagination component
│   │   ├── 📁 lib/              # Library and utilities
│   │   │   ├── api/             # API client libraries
│   │   │   │   ├── client.ts    # Base API client
│   │   │   │   ├── auth.ts      # Authentication API
│   │   │   │   ├── location.ts  # Location API
│   │   │   │   ├── transactions.ts # Transaction API
│   │   │   │   └── analytics.ts # Analytics API
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   │   ├── useAuth.ts   # Authentication hook
│   │   │   │   ├── useLocale.ts # Localization hook
│   │   │   │   ├── useCurrency.ts # Currency hook
│   │   │   │   ├── useLocation.ts # Location hook
│   │   │   │   ├── useTransactions.ts # Transaction hook
│   │   │   │   └── useMediaQuery.ts # Media query hook
│   │   │   ├── stores/          # Global state stores
│   │   │   │   ├── authStore.ts # Authentication store
│   │   │   │   ├── locationStore.ts # Location store
│   │   │   │   ├── transactionStore.ts # Transaction store
│   │   │   │   └── settingsStore.ts # Settings store
│   │   │   ├── utils/           # Utility functions
│   │   │   │   ├── currency.ts  # Currency utilities
│   │   │   │   ├── date.ts      # Date utilities
│   │   │   │   ├── validation.ts # Validation utilities
│   │   │   │   ├── formatters.ts # Data formatters
│   │   │   │   └── mapUtils.ts  # Map utilities
│   │   │   ├── constants/       # Application constants
│   │   │   │   ├── countries.ts # Country definitions
│   │   │   │   ├── currencies.ts # Currency definitions
│   │   │   │   ├── businessTypes.ts # Business type definitions
│   │   │   │   └── routes.ts    # Route definitions
│   │   │   └── types/           # TypeScript definitions
│   │   │       ├── index.ts     # Main type definitions
│   │   │       ├── api.ts       # API type definitions
│   │   │       ├── location.ts  # Location type definitions
│   │   │       ├── transaction.ts # Transaction type definitions
│   │   │       ├── user.ts      # User type definitions
│   │   │       └── analytics.ts # Analytics type definitions
│   │   └── 📁 messages/         # Internationalization files
│   │       ├── en.json          # English translations
│   │       ├── id.json          # Indonesian translations
│   │       ├── th.json          # Thai translations
│   │       ├── vi.json          # Vietnamese translations
│   │       ├── tl.json          # Tagalog translations
│   │       ├── ja.json          # Japanese translations
│   │       └── ko.json          # Korean translations
│   └── 📁 public/               # Static assets
│       └── flags/               # Country/region flags
└── 📁 shared/                   # Shared resources
    └── 📁 constants/            # Shared constants
        └── common-constants.ts  # Common constants
    └── 📁 types/               # Shared type definitions
        └── api-types.ts        # Shared API types
```

## 🔐 Security Features

- **Rate Limiting**: API rate limiting protection
- **Authentication**: Secure user authentication
- **Authorization**: Role-based access control
- **Data Validation**: Comprehensive input validation
- **Audit Logging**: Complete audit trail

## 📈 Key Capabilities

### Financial Management
- Automated expense categorization
- Financial report generation
- Document processing and storage
- Multi-currency support

### Location Intelligence
- Demographic analysis
- Competitor analysis
- Traffic pattern analysis
- Revenue potential assessment
- Risk assessment

### Business Planning
- Scenario planning
- Financial forecasting
- Budget creation
- Performance monitoring
- Goal tracking

## 🤝 Contributing

This project is proprietary software. All rights reserved.

For licensing inquiries or permissions, please contact the copyright holder.

## 📄 License

Copyright (C) 2025 Finaya. All Rights Reserved.

See [LICENSE](LICENSE) file for complete license terms.

## 🆘 Support