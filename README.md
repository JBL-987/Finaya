# Finaya - Agentic AI Business Location Consultant

> **Built for Google Gemini Hackathon**  
> Finaya is an autonomous AI agent that scouts, reasons, and advises on business locations. It doesn't just show data; it thinks through complex geospatial patterns to project profitability.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)
[![Interactive Maps](https://img.shields.io/badge/Maps-Interactive-E60012)](https://ai.google.dev/)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Finaya** is an intelligent geospatial analysis platform that helps businesses make data-driven location decisions. By leveraging Google Gemini AI's multimodal capabilities and comprehensive geospatial data, Finaya analyzes potential business locations and provides detailed profitability projections.

Unlike traditional map-based analysis tools, Finaya does not rely solely on visual interpretation. It combines Gemini multimodal analysis with a probabilistic traffic flow model, weather impact modeling (VIC), and geospatial mathematics to simulate how people realistically move through roads and junctions before calculating revenue projections.

### The Problem

- **82%** of businesses fail due to poor location choices
- Traditional location analysis is time-consuming and expensive
- Lack of comprehensive data-driven insights for location decisions

### Our Solution

Finaya provides:
- **AI-powered location analysis** using Google Gemini's vision capabilities
- **Real-time profitability calculations** based on geospatial data
- **Interactive map visualization** with advanced geospatial data
- **Comprehensive business metrics** including revenue projections and ROI estimates

## Key Features

### Agentic AI Capabilities
- **Autonomous Reasoning (Deep Think)**: Gemini AI processes map data with step-by-step reasoning (Chain-of-Thought) to ensure high-accuracy profitability projections.
- **AI Business Advisor**: Real-time agentic consultant to answer strategic questions about ROI, competition, and business model pivots.
- **Autonomous Exploration**: Agent scouts for 'golden locations' within a radius to maximize business potential.
- **Contextual Memory**: Remembers analysis history to compare locations with deep semantic understanding.

### Probabilistic Traffic & Weather Modeling (Core Engine)

Finaya introduces a custom mathematical engine that simulates real human movement instead of making static assumptions:

- **Junction Probability Model**: Traffic flow is modeled using B/T junction probabilities to estimate realistic passing traffic in front of a storefront.
- **Weather Visitor Impact Coefficient (VIC)**: Weather conditions dynamically reduce or increase actual visitors before revenue is calculated.
- **Geospatial Area Computation**: Screenshot pixels and map scale are converted into real-world area to estimate population and road density.
- **Traffic → Visitors → Buyers Pipeline**: Revenue is computed from simulated passing traffic, not raw population estimates.

### Smart Business Metrics
- **Revenue Projections**: Daily, monthly, and yearly revenue estimates
- **Cost Analysis**: Comprehensive breakdown of operational costs
- **ROI Calculations**: Return on investment projections
- **Profitability Scoring**: Data-driven location viability assessment

### Interactive Map Visualization
- **Advanced Maps Integration**: High-quality, interactive maps
- **Real-time Location Data**: POI information and area demographics
- **Screenshot Capture**: Automated map screenshot for AI analysis
- **Multi-currency Support**: 50+ currencies for global coverage

### User Management & Dashboard
- **Secure Authentication**: Google Sign-In & JWT-based auth
- **Personalized Dashboard**: Real-time overview of analysis activities
- **Analytics Visualization**: Interactive charts for usage trends (12-month history)
- **Analysis History**: Save, retrieve, and compare past location reports
- **User Preferences**: Customizable currency and profile settings
- **Multi-language Support**: Available in 15+ languages

### Interactive Map Visualization
- **Advanced Maps Integration**: High-quality, interactive maps
- **Real-time Location Data**: POI information and area demographics
- **Screenshot Capture**: Automated map screenshot for AI analysis
- **Multi-currency Support**: 50+ currencies for global coverage

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS + Shadcn UI
- **Maps**: Interactive Maps SDK
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Animations**: GSAP, Framer Motion, Motion
- **Visualization**: Recharts (for Dashboard analytics)
- **UI Components**: Lucide Icons, React Fast Marquee

### Backend
- **Framework**: FastAPI (Python)
- **AI Integration**: Google Gemini Multimodal (Vision) API
- **Traffic Engine**: Probabilistic junction-based traffic simulation
- **Weather Engine**: Visitor Impact Coefficient (VIC) modeling
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication + JWT tokens
- **Rate Limiting**: SlowAPI with Redis
- **Geocoding**: Nominatim (OpenStreetMap)

### Infrastructure
- **Deployment**: Cloud Infrastructure
- **Caching**: Redis
- **Storage**: Firebase Storage
- **CI/CD**: GitHub Actions (optional)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │  React   │  │ Interactive│  │  Business Analysis       │ │
│  │  + Vite  │  │   Maps   │  │  Components              │ │
│  └──────────┘  └──────────┘  └──────────────────────────┘ │
│       │             │                     │               │
│       └─────────────┼─────────────────────┼───────────────┘
│                     ▼                     ▼
│              ┌──────────────┐      ┌──────────────┐
│              │  Dashboard   │      │ Shadcn UI    │
│              │  Analytics   │      │ + Recharts   │
│              └──────────────┘      └──────────────┘
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │  Auth    │  │ Analysis │  │  Geospatial Services     │ │
│  │  Service │  │ Service  │  │  (Nominatim)             │ │
│  └──────────┘  └──────────┘  └──────────────────────────┘ │
│       │             │                     │               │
│       └─────────────┼─────────────────────┼───────────────┘
│                     ▼                     ▼
│              ┌──────────────┐      ┌──────────────┐
│              │  AI Agent    │      │ Places API   │
│              │  (Advisor)   │      │ (Competitors)│
│              └──────────────┘      └──────────────┘
└─────────────────────────────────────────────────────────────┘
                            |
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Google  │    │ Firebase │    │  Redis   │    │ Traffic & │
    │  Gemini  │    │Firestore │    │  Cache   │    │ Weather   │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Redis** (for rate limiting)
- **Firebase Account** (for database and authentication)
- **Google Gemini API Key** (Google AI Studio)
- **Maps API Key** (for geospatial services)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finaya.git
cd finaya
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `.env` file:**

```env
# API Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# JWT Secret
SECRET_KEY=your_secret_key_here

# Google Gemini Vision API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379
```

**Run Backend:**

```bash
python main.py
# or
uvicorn main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Configure `.env` file:**

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1

# (optional) if frontend needs AI access
VITE_GEMINI_API_KEY=your_gemini_api_key

# Mapping Configuration
VITE_MAP_API_KEY=your_maps_api_key
```

**Run Frontend:**

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

### Database Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** in your Firebase project
3. Enable **Firebase Authentication** with Email/Password provider
4. Create a service account:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file
   - Extract the credentials and add them to your `.env` file

5. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Analyses collection
    match /analyses/{analysisId} {
      allow read, write: if request.auth != null && 
                           resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

6. Firestore Collections Structure:

**users** collection:
```json
{
  "uid": "firebase_auth_uid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**analyses** collection:
```json
{
  "id": "auto_generated_id",
  "user_id": "firebase_auth_uid",
  "name": "Business Analysis - Location Name",
  "location": "lat,lon",
  "analysis_type": "business_profitability",
  "data": {
    "business_params": {},
    "screenshot_metadata": {},
    "metrics": {}
  },
  "gemini_analysis": {
    "area_distribution": {}
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Usage

### 1. Register/Login

- Navigate to `http://localhost:5173`
- Click "Get Started Free" or login if you have an account
- Create an account with email and password

### 2. Select Location

- Use the interactive maps to navigate to your desired location
- Click on the map to select a specific point
- The system will automatically capture the map area

### 3. Input Business Parameters

- **Building Width**: Width of your business storefront (meters)
- **Operating Hours**: Daily operating hours
- **Product Price**: Average product/service price

### 4. Analyze Location

- Click "Analyze Location"
- Google Gemini AI analyzes the map screenshot to extract area distribution, which is then processed by Finaya’s traffic and weather engine to simulate realistic visitor flow before calculating revenue.
- View comprehensive results including:
  - Area distribution (residential, roads, open spaces)
  - Population estimates
  - Revenue projections (daily, monthly, yearly)
  - Profitability metrics

### 5. Save & Review

- Save analysis results to your account
- View analysis history in your dashboard
- Compare different locations

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=securepassword
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Analysis Endpoints

#### Analyze Location (with auto-save)
```http
POST /api/v1/analysis/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "lat,lon",
  "business_params": {
    "buildingWidth": 10,
    "operatingHours": 12,
    "productPrice": 50000
  },
  "screenshot_base64": "base64_encoded_image",
  "screenshot_metadata": {
    "width": 800,
    "height": 600,
    "scale": 1.5
  }
}
```

#### Get All Analyses
```http
GET /api/v1/analysis/
Authorization: Bearer <token>
```

#### Get Specific Analysis
```http
GET /api/v1/analysis/{analysis_id}
Authorization: Bearer <token>
```

## Project Structure

```
finaya/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py          # Authentication endpoints
│   │   │       └── analysis.py      # Analysis endpoints
│   │   ├── core/
│   │   │   ├── config.py            # Configuration
│   │   │   ├── database.py          # Database connection
│   │   │   ├── dependencies.py      # DI container
│   │   │   └── middleware.py        # Custom middleware
│   │   ├── repositories/
│   │   │   ├── analysis_repository.py
│   │   │   └── user_repository.py
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic models
│   │   └── services/
│   │       ├── analysis_service.py
│   │       ├── auth_service.py
│   │       ├── gemini_service_analysis.py  # Gemini+traffic+weather engine
│   │       ├── traffic_probability.py          # Junction probability model
│   │       └── weather_probability.py          # VIC weather model
│   ├── main.py                      # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   └── Finaya_Logo.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIWorkflowProgress.jsx
│   │   │   ├── AnalysisForm.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── BusinessAnalysisApp.jsx
│   │   │   ├── CurrencySelector.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MapComponent.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProgressPanel.jsx
│   │   │   └── ResultsPanel.jsx
│   │   ├── contexts/
│   │   │   └── CurrencyContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── App.jsx
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   ├── api.js               # API client
│   │   │   ├── currencies.js        # Currency data
│   │   │   └── mapScreenshot.js     # Map capture utility
│   │   ├── utils/
│   │   │   └── cn.js                # Utility functions
│   │   └── main.jsx                 # App entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Google Gemini** for providing powerful multimodal AI capabilities
- **Cloud Infrastructure** for high-performance hosting and mapping services
- **Firebase** for database and authentication services
- **OpenStreetMap** for geocoding services

## Contact

- **Project Link**: [https://github.com/yourusername/finaya](https://github.com/yourusername/finaya)
- **Email**: your.email@example.com

---

**Built with care for Google Gemini 3 Hackathon**

Making business location decisions smarter, one analysis at a time.
