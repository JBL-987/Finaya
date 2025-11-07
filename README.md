# 🤖 Finaya: Your AI Financial Co-Pilot for the Asia-Pacific

Welcome to **Finaya**, our official entry for the **Huawei APAC Competition 🏆**.

Finaya is a next-generation FinTech platform built to empower the engine of the Asia-Pacific economy: Small and Medium-sized Enterprises (SMEs). We turn financial complexity into a competitive advantage by leveraging the power of **Huawei Cloud** and **AI**.

## The APAC Challenge (The Market Need) 🌏

Across the diverse APAC market, SMEs are rising. But they face critical, unmet challenges:

  * **Overwhelming Complexity 🤯:** Juggling multi-currency invoices, complex tax laws, and tedious bookkeeping.
  * **Inaccessible Expertise 💰:** Professional financial advisors and business analysts are a luxury most SMEs cannot afford.
  * **Data Silos 🗄️:** Critical financial data is locked away in scattered PDFs, spreadsheets, and bank statements, making real-time insights impossible.

## Our Solution: Finaya (Product-Market Fit) 🚀

Finaya is the all-in-one platform that acts as an **AI-powered co-pilot** for these businesses. We automate the tedious work and provide actionable, intelligent advice, moving businesses from *surviving* to *thriving*.

This provides clear, **tangible benefits**:

1.  **Reduces Costs** by automating manual data entry and compliance tasks.
2.  **Saves Time** by generating instant, in-depth reports and analysis.
3.  **Unlocks Growth** by providing AI-driven strategic advice that was previously unaffordable.

### Key Features (Functionality & Creativity) 🌟

| Feature | Description (Innovative Concept) |
| :--- | :--- |
| 📄 **Intelligent Document Processing** | Automatically extracts, validates, and categorizes data from any financial document—PDF invoices, DOCX contracts, and XLSX spreadsheets. |
| 🤖 **Your Personal AI Financial Advisor** | Ask complex questions in plain English ("What's our biggest cash flow risk next month?") and get strategic, data-backed answers, powered by **Huawei Cloud AI**. |
| 📊 **Deep Business Analysis** | Go beyond simple reports. Finaya uncovers hidden trends, identifies risks, and flags growth opportunities you might have missed. |
| 🧾 **Automated Accounting** | Streamline journal entries, manage ledgers, and automate bank reconciliation with just a few clicks. |
| 📈 **Dynamic Reporting & Visuals** | Instantly generate beautiful, interactive P\&L statements, balance sheets, and cash flow reports. Export to PDF or CSV in seconds. |

-----

## Finaya & Huawei Cloud: A Winning Architecture

Our technical architecture is designed for security, stability, and scalability, with **Huawei Cloud services** at its core. This integration is not an add-on; it is fundamental to the project's functionality and impact.

| Huawei Cloud Service | Role in Finaya (Enhancing Functionality & Stability) |
| :--- | :--- |
| **ModelArts & Pangu LLM** | **(AI Bonus)** Powers our "Personal AI Financial Advisor." This *enhances functionality* by providing deep, generative AI insights, not just static data. |
| **Elastic Cloud Server (ECS)** | Hosts our high-performance **FastAPI** backend. ECS provides the reliable, scalable compute needed for our Python data analysis and API logic. |
| **GaussDB (for PostgreSQL)** | Serves as our primary, high-performance relational database. This ensures *soundness and stability* for all critical financial ledgers, user data, and transactions. |
| **Object Storage Service (OBS)** | Securely stores all user-uploaded financial documents (PDFs, DOCX, etc.). This provides a *secure, durable, and scalable* solution for unstructured data. |

### Functionality & User Experience

The application's functions are logical and fully operational. The frontend, built with **React 18 + Vite**, offers an instantaneous, interactive interface. By using **Tailwind CSS & Shadcn/UI**, we ensure a *smooth and engaging user experience* that is both modern and accessible.

-----

## Full Technology Stack 🛠️

### 🎨 Frontend (Modern & Interactive UI)

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Core** | `react`, `vite` | Powering the entire user interface. |
| **Styling** | `tailwindcss`, `@shadcn/ui` | Beautiful, modern, and accessible components. |
| **Routing** | `react-router-dom` | Seamless navigation within the app. |
| **Data Fetching**| `axios` | Communicating with our powerful backend. |
| **BaaS Client** | `@supabase/supabase-js` | Real-time database and auth. |
| **Charts & Viz** | `chart.js`, `recharts` | Interactive and clear financial visualizations. |
| **File Handling**| `jspdf`, `xlsx`, `react-pdf` | For creating and previewing any financial doc. |

### 🧠 Backend (Fast, Scalable & Secure Core)

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Web Framework**| `fastapi` | Blazing-fast API for all backend logic. |
| **Server** | `uvicorn` | High-performance ASGI server to run FastAPI. |
| **Database** | `asyncpg`, `supabase` | Asynchronous PostgreSQL driver & Supabase client. |
| **Security** | `python-jose`, `passlib` | Secure JWT (token) handling & password hashing. |
| **Config** | `pydantic-settings` | Clean, type-safe environment management. |
| **Performance** | `slowapi`, `redis` | Rate limiting to prevent abuse & in-memory caching. |
| **AI & Data** | `pandas`, `numpy`, `scipy` | The core stack for all our financial analysis\! |

-----

## Project Structure

This repository follows a clean, decoupled frontend/backend architecture, demonstrating a sound and maintainable design.

```
Finaya/
├── frontend/                 # React 18 + Vite App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # App pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API clients (Axios)
│   │   └── main.jsx          # App entry point
│   └── package.json
├── backend/                  # FastAPI App
│   ├── app/
│   │   ├── api/              # API endpoints/routers
│   │   ├── core/             # Config, security, dependencies
│   │   ├── repositories/     # Database logic
│   │   ├── services/         # Business logic & AI integration
│   │   └── schemas/          # Pydantic data models
│   ├── main.py               # App entry point
│   └── requirements.txt
└── README.md
```

## Get Finaya Running\! 🏁

### 1\. Run the Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install all the dependencies
npm install

# Start the local development server 🚀
npm run dev
```

Your frontend is now live at `http://localhost:5173` (or similar).

### 2\. Run the Backend

```bash
# Navigate to the backend directory
cd backend

# (It's highly recommended to use a Python virtual environment)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install all the Python dependencies
pip install -r requirements.txt

# Start the local API server ⚡
uvicorn main:app --reload
```

Your backend API is now live at `http://127.0.0.1:8000`.
