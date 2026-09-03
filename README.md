# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in the values (see table below)
npm run dev                 # or: npm start   (http://localhost:5000)
npm run seed                # optional with a real MONGO_URI — seeds demo users & products
```

### 2. Frontend

```bash
cd frontend
npm install
# local dev: no .env needed — Vite proxies /api → http://localhost:5000
npm run dev                 # http://localhost:5173
```

## 👥 Test credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@123` |
| Sales Person | `sales@example.com` | `Sales@123` |
| Sales Person 2 | `sales2@example.com` | `Sales@123` |
| Customer | `user@example.com` | `User@123` |

Register freely as **Customer** or **Sales Person** — self-registration as Admin is blocked on the backend.
