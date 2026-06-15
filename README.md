# 🛒 ShopHub — ecommerce-devops

A production-ready full-stack e-commerce application built with React, Node.js, MongoDB, Docker, and Jenkins CI/CD.

---

## Features

- **Authentication** — JWT-based register / login / logout with bcrypt password hashing
- **Product Catalog** — full-text search, category filtering, price range, pagination, reviews
- **Shopping Cart** — persistent server-side cart with stock validation
- **Orders** — checkout flow, order history, admin status management
- **Admin Dashboard** — product CRUD, order management, user management
- **DevOps** — Dockerised services, automated CI/CD via Jenkins

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, Redux Toolkit, React Router 6, Axios |
| Backend     | Node.js 20, Express 4, Mongoose 8              |
| Database    | MongoDB 7                                       |
| Auth        | JWT, bcryptjs                                   |
| Validation  | express-validator                               |
| Logging     | Winston, Morgan                                 |
| Containers  | Docker, Docker Compose                          |
| CI/CD       | Jenkins (Declarative Pipeline)                  |
| Web Server  | Nginx (SPA serving + API proxy)                 |

---

## Folder Structure

```
ecommerce-devops/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js
│   │   ├── controllers/     # authController, productController, cartController, orderController, userController
│   │   ├── middleware/       # authMiddleware, adminMiddleware, errorMiddleware, rateLimitMiddleware
│   │   ├── models/          # User, Product, Category, Cart, Order
│   │   ├── routes/          # authRoutes, productRoutes, cartRoutes, orderRoutes, userRoutes
│   │   ├── utils/           # apiResponse, generateToken, logger
│   │   ├── validators/      # authValidator, productValidator
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── integration/     # auth.test.js, product.test.js
│   │   └── unit/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # LoginForm, RegisterForm
│   │   │   ├── cart/        # CartItem, CartSummary
│   │   │   ├── common/      # Navbar, Footer, Loader
│   │   │   └── product/     # ProductCard, ProductFilter, ProductList
│   │   ├── pages/           # HomePage, LoginPage, RegisterPage, ProductsPage,
│   │   │                    # ProductPage, CartPage, CheckoutPage, OrdersPage,
│   │   │                    # OrderDetailPage, AdminDashboard, NotFoundPage
│   │   ├── routes/          # AppRoutes, PrivateRoute, AdminRoute
│   │   ├── services/        # api.js, authService, productService, cartService, orderService
│   │   ├── store/           # Redux store + slices (auth, cart, products)
│   │   ├── styles/          # global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker/
│   ├── mongo/init-db.js     # DB init + seed script
│   └── nginx/nginx.conf     # Standalone reverse proxy config
│
├── jenkins/
│   ├── Jenkinsfile
│   └── scripts/
│       ├── build.sh
│       ├── test.sh
│       └── deploy.sh
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```

---

## Local Development (without Docker)

### Prerequisites
- Node.js 20+
- MongoDB 7 running locally on port 27017

### Backend

```bash
cd backend
cp .env.example .env          # edit MONGO_URI and JWT_SECRET
npm install
npm run dev                   # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000/api
npm install
npm run dev                   # starts on http://localhost:5173
```

---

## Docker Setup

### First run (builds images and starts all services)

```bash
docker compose up --build
```

### Subsequent runs

```bash
docker compose up -d          # detached mode
docker compose logs -f        # tail all logs
docker compose logs -f backend # tail backend only
```

### Stop and clean up

```bash
docker compose down           # stop containers (keep volumes)
docker compose down -v        # stop containers AND delete MongoDB data
```

### Access

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000            |
| Backend  | http://localhost:5000/api/health |
| MongoDB  | mongodb://localhost:27017        |

### Default admin credentials (seeded by init-db.js)

```
Email:    admin@shophub.com
Password: Admin@123
```

> **Change this immediately** in any non-local environment.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Description                          | Default                    |
|-----------------------|--------------------------------------|----------------------------|
| `NODE_ENV`            | Runtime environment                  | `development`              |
| `PORT`                | HTTP server port                     | `5000`                     |
| `MONGO_URI`           | MongoDB connection string            | `mongodb://localhost/ecommerce` |
| `JWT_SECRET`          | Secret for signing JWTs (min 32 chars) | —                        |
| `JWT_EXPIRES_IN`      | Token expiry                         | `7d`                       |
| `CLIENT_ORIGIN`       | Allowed CORS origin                  | `http://localhost:5173`    |
| `RATE_LIMIT_WINDOW_MS`| Rate limit window in ms              | `900000` (15 min)          |
| `RATE_LIMIT_MAX`      | Max requests per window              | `100`                      |

### Frontend (`frontend/.env`)

| Variable             | Description              | Default                        |
|----------------------|--------------------------|--------------------------------|
| `VITE_API_BASE_URL`  | Backend API base URL     | `http://localhost:5000/api`    |

---

## API Endpoints

### Auth  `/api/auth`

| Method | Path               | Auth     | Description          |
|--------|--------------------|----------|----------------------|
| POST   | `/register`        | Public   | Create account       |
| POST   | `/login`           | Public   | Login, receive JWT   |
| POST   | `/logout`          | Public   | Logout hint          |
| GET    | `/me`              | 🔒 User  | Get own profile      |
| PUT    | `/change-password` | 🔒 User  | Change password      |

### Products  `/api/products`

| Method | Path              | Auth      | Description              |
|--------|-------------------|-----------|--------------------------|
| GET    | `/`               | Public    | List (filter/sort/page)  |
| GET    | `/featured`       | Public    | Featured products        |
| GET    | `/slug/:slug`     | Public    | By URL slug              |
| GET    | `/:id`            | Public    | By ID                    |
| POST   | `/`               | 🔒👑 Admin | Create product           |
| PUT    | `/:id`            | 🔒👑 Admin | Update product           |
| DELETE | `/:id`            | 🔒👑 Admin | Soft-delete product      |
| POST   | `/:id/reviews`    | 🔒 User   | Add/update review        |
| DELETE | `/:id/reviews`    | 🔒 User   | Delete own review        |

### Cart  `/api/cart`

| Method | Path          | Auth    | Description         |
|--------|---------------|---------|---------------------|
| GET    | `/`           | 🔒 User | View cart           |
| POST   | `/`           | 🔒 User | Add item            |
| PUT    | `/:productId` | 🔒 User | Update quantity     |
| DELETE | `/:productId` | 🔒 User | Remove item         |
| DELETE | `/`           | 🔒 User | Clear cart          |

### Orders  `/api/orders`

| Method | Path           | Auth      | Description          |
|--------|----------------|-----------|----------------------|
| POST   | `/`            | 🔒 User   | Create order         |
| GET    | `/my-orders`   | 🔒 User   | Own order history    |
| GET    | `/:id`         | 🔒 User   | Order detail         |
| PUT    | `/:id/pay`     | 🔒 User   | Mark as paid         |
| GET    | `/`            | 🔒👑 Admin | All orders           |
| PUT    | `/:id/status`  | 🔒👑 Admin | Update status        |

### Users  `/api/users`

| Method | Path       | Auth      | Description       |
|--------|------------|-----------|-------------------|
| GET    | `/profile` | 🔒 User   | Own profile       |
| PUT    | `/profile` | 🔒 User   | Update profile    |
| GET    | `/`        | 🔒👑 Admin | All users         |
| DELETE | `/:id`     | 🔒👑 Admin | Deactivate user   |

🔒 = JWT required &nbsp; 👑 = admin role required

---

## Running Tests

```bash
cd backend
npm test                      # all tests
npm run test:unit             # unit tests only
npm run test:integration      # integration tests only
```

---

## Jenkins CI/CD Setup

### 1. Install Jenkins plugins
- NodeJS Plugin
- Docker Pipeline Plugin
- SSH Agent Plugin
- Git Plugin

### 2. Configure tools
Jenkins → Manage Jenkins → Global Tool Configuration:
- Add NodeJS installation named **`NodeJS-20`**

### 3. Add credentials
Jenkins → Manage Jenkins → Credentials:
- `DOCKER_CREDENTIALS_ID` — Docker Hub username + password
- `SSH_DEPLOY_KEY` — SSH private key for the deploy server

### 4. Set environment variables
Jenkins → Manage Jenkins → System:
- `DOCKER_REGISTRY` — e.g. `docker.io/youruser`
- `DEPLOY_HOST` — e.g. `ubuntu@192.168.1.100`
- `DEPLOY_PATH` — e.g. `/opt/ecommerce-devops`
- `DEPLOY_HOST_URL` — e.g. `http://192.168.1.100:5000`

### 5. Create pipeline job
- New Item → Pipeline
- Pipeline → Definition: **Pipeline script from SCM**
- SCM: Git → your repository URL
- Script Path: `jenkins/Jenkinsfile`

### CI/CD Flow

```
Push to GitHub
      │
      ▼
Jenkins detects change
      │
      ├─ Checkout code
      ├─ npm ci (backend)
      ├─ npm test (backend)
      ├─ npm ci (frontend)
      ├─ npm run build (frontend)
      ├─ docker build (backend + frontend)
      │
      ├─ [main branch only]
      │   ├─ docker push → registry
      │   ├─ SSH deploy → server
      │   └─ Health check verification
      │
      └─ Cleanup workspace
```

---

## Deployment

### Production with Docker Compose

```bash
# On the production server
git clone https://github.com/youruser/ecommerce-devops.git
cd ecommerce-devops

# Create production env file
cp backend/.env.example backend/.env
# Edit backend/.env with real secrets

# Start with production overrides
IMAGE_TAG=latest docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGO_URI` missing error on startup | Copy `.env.example` to `.env` and fill in values |
| Port 5000 already in use | Change `PORT` in `.env` or stop the conflicting process |
| Docker build fails on `bcryptjs` | Ensure the backend Dockerfile installs `python3 make g++` (already included) |
| Frontend shows blank page | Check browser console; ensure `VITE_API_BASE_URL` points to the running backend |
| JWT token rejected after password change | This is by design — log in again to get a fresh token |
| MongoDB connection refused in Docker | Ensure the `mongodb` service is healthy before the backend starts (`depends_on: condition: service_healthy`) |
| Jenkins pipeline fails at Docker push | Verify `DOCKER_CREDENTIALS_ID` credential is configured correctly |

---

## License

MIT — see [LICENSE](LICENSE) for details.
