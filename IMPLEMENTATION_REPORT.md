# Project Report — ShopKart (Role-Based E-Commerce Platform)

**Stack used:** React (Vite) · Node.js + Express · MongoDB (Mongoose) · Cloudinary · Razorpay · JWT + bcrypt

**What the project does:** An online shopping website with 3 types of users — Admin, Sales Person and normal User. Each role can do only what it is allowed to do, and the backend enforces these rules (not just the UI).

---

## 1. Implemented Features

### 1.1 Authentication (Register / Login)

- A new user registers with name, email and password. The password is **never stored as plain text** — it is converted into a hash using **bcrypt** (a one-way encryption library). Even if someone steals the database, they cannot read the passwords.
- On login, the backend checks the email, compares the password hash with `bcrypt.compare()`, and if correct, sends back a **JWT (JSON Web Token)**.
- A JWT is like a signed "pass card" — it contains the user's id and role, is signed with a secret key on the server, and has an expiry (7 days in this project).
- The frontend saves this token and sends it with every request in the `Authorization: Bearer <token>` header.
- The backend verifies the token on every protected request using a middleware called `protect`. If the token is missing/expired/tampered, it returns **401 (Not Authorized)**.
- Another middleware `authorize('admin', 'sales', ...)` checks the role. If a user without the right role tries a restricted action, the backend returns **403 (Forbidden)** — even if they call the API directly with tools like Postman. This is called **Role-Based Access Control (RBAC)**.

### 1.2 Product CRUD (+ Cloudinary images)

- **Create:** Admin and Sales Person can add products (name, description, price, category, brand, stock, images).
- **Read:** Anyone (even without login) can browse products with **keyword search, category filter, price range filter, sorting and pagination**.
- **Update / Delete:** A Sales Person can edit or delete **only their own products** — the backend checks `product.seller == logged-in user` before allowing it. Admin can manage everything.
- **Images (Cloudinary):** When an image is uploaded, it is kept in server memory only (multer memory storage) and streamed directly to **Cloudinary** (an image hosting cloud). The database stores only the image **URL**, never the raw file. Deleted/replaced images are also removed from Cloudinary.
- Stock is validated on the backend: you cannot order more than available stock, and stock decreases automatically when an order is placed.

### 1.3 Cart & Wishlist

- **Cart:** One cart document per user in MongoDB. A logged-in user can add products, increase/decrease quantity, remove items or clear the whole cart. Every change is saved on the server, so the cart is the same on any device.
- Cart total and item count are always **calculated on the server** from real database prices — the client can never send a fake price.
- The navbar shows a live **cart count badge** which updates instantly.
- **Wishlist:** Users can save products they like for later, remove them, or move them to the cart with one click.

### 1.4 Razorpay Payments (test mode)

The payment flow has 3 steps, designed so that a "fake success" is impossible:

1. **Create order:** The frontend calls `POST /api/payments/create-order`. The backend re-reads the cart, checks stock, calculates the total **server-side** and creates a Razorpay order (amount in paise). The client never decides the amount.
2. **Pay:** The Razorpay checkout widget opens. In test mode you can pay with test cards (e.g. `4111 1111 1111 1111`) or UPI (`success@razorpay`).
3. **Verify signature:** After payment, Razorpay returns `order_id`, `payment_id` and a `signature`. The frontend sends these to `POST /api/payments/verify`. The backend re-calculates the expected signature using **HMAC-SHA256 of `order_id|payment_id` with the secret key** and compares it using a timing-safe comparison. **Only if the signature matches** does the backend save the order (status = paid), decrease stock and clear the cart. If the signature is wrong, no order is created.

**Demo mode (extra):** If Razorpay keys are not configured, the app automatically runs a local "demo gateway" (development only). It behaves exactly like Razorpay — including the same HMAC signature verification — so the full flow can be tested without keys. The demo screen also has a "decline payment" option that sends a wrong signature, proving the verification actually rejects bad payments.

### 1.5 Frontend Architecture

- **React 18 + Vite** (fast dev server and builds), **React Router** for pages, **Tailwind CSS** for styling (utility classes written directly inside JSX).
- **Contexts (global state):**
  - `AuthContext` — current user + token, auto-restores the session on page refresh by calling `/auth/me`.
  - `CartContext` / `WishlistContext` — items and counts shared across the whole app.
  - `ToastContext` — small success/error popups.
- **axios instance** with interceptors: every request automatically attaches the JWT; if a 401 comes back, the session is cleared and the user is sent to the login page with the real reason.
- **Protected routes:** pages like Checkout/Orders check login; dashboards check the role. But this is only for good UX — the real security is always on the backend.
- **Pages:** Home (shop grid + filters), Product Detail, Login/Register (with one-click demo login buttons), Cart, Wishlist, Checkout (address + payment), Order Success, My Orders, Admin Dashboard (stats/users/orders/products), Sales Dashboard (own products/orders).

---

## 2. Challenges Faced & How I Solved Them

| # | Challenge | How I solved it |
|---|---|---|
| 1 | Reviewer may not have MongoDB installed, so the project would not start | Added a dev fallback: if `MONGO_URI` is not set, the backend automatically starts a local file-backed MongoDB (data survives restarts) and seeds demo users/products |
| 2 | Passwords must not be readable even if DB leaks | Stored only **bcrypt hashes**; plain password never saved or logged |
| 3 | Anyone could fake a "payment successful" callback and get a free order | Order is saved **only after server-side HMAC signature verification**; amounts are re-calculated on the server at verify time |
| 4 | Hiding buttons in the UI is not real security (API can be called directly) | Every permission is checked in backend middleware first (`protect` + `authorize`). Tested with direct API calls — wrong roles always get 403 |
| 5 | Image upload should not fill the server's disk | Multer keeps files in memory, they are streamed straight to Cloudinary; DB stores only URLs |
| 6 | `.env.example` had placeholder keys (`your_api_key`), so the server tried to call Cloudinary with fake values → "Unknown API key" error | Added a check that treats blank/placeholder values as "not configured" and falls back to local demo image storage; real keys auto-activate Cloudinary |
| 7 | CORS errors when the frontend ran inside a preview popup (different origin) | Dev/preview mode accepts any origin; production uses a strict `CLIENT_URL` allow-list |
| 8 | Session logged out a few seconds after signup in the preview tunnel (the proxy stripped the Authorization header and blocked cookies) | The JWT is now sent over 4 transports (Authorization header, X-Auth-Token header, cookie, and a query param as last resort) and the backend accepts whichever arrives |
| 9 | App crashed with "destroy is not a function" | `window.scrollTo()` returns a Promise in modern browsers; I had written `useEffect(() => window.scrollTo(0,0), …)` which React treated as an invalid cleanup function. Fixed by using a block-bodied effect |
| 10 | Sales person must see only their own products/orders, even inside shared endpoints | Server always reads the seller id from the JWT (never from the request body), and order queries filter by `items.seller` |

---

## 3. Pending / Known Limitations

- **Razorpay webhooks** (server-to-server payment confirmation) are not implemented — the checkout signature verification covers the required flow.
- **Real payment keys on production:** demo gateway runs only in development; the deployed backend needs real Razorpay test keys and Cloudinary keys (both free) for payments and uploads.
- **No password reset or email verification** (no email service integrated).
- **No product reviews/ratings or coupon codes** (out of scope for a one-day task).
- **JWT stored in localStorage** — this can be stolen via XSS. A production-grade approach would use httpOnly cookies with refresh-token rotation.
- **Customers cannot cancel orders** — only admin controls order status (deliberate scope decision).
- **No automated tests** (unit/integration). Testing was done manually and with direct API calls (Postman/curl) covering the 401/403 permission matrix, payment signature rejection and stock validation.
- Free-tier hosting (Render) sleeps after ~15 minutes of inactivity, so the first request can take up to a minute.

---

## 4. Test Credentials

| Role | Email | Password | What this role can do |
|------|-------|----------|----------------------|
| **Admin** | `admin@example.com` | `Admin@123` | Everything — manage all products, users & roles, all orders, see sales statistics |
| **Sales Person** | `sales@example.com` | `Sales@123` | Add/edit/delete **own** products, view orders that contain their products |
| **Sales Person 2** | `sales2@example.com` | `Sales@123` | Second sales account — useful to prove one seller cannot touch another seller's products |
| **User** | `user@example.com` | `User@123` | Browse/search/filter, cart, wishlist, checkout, own order history |

> The login page also has **one-click fill buttons** for these demo accounts.
> New accounts can be created from the Register page (role = user).

**Razorpay test payment:** card `4111 1111 1111 1111` (any future expiry, any CVV) or UPI `success@razorpay`. Without keys, the built-in demo gateway handles the payment with the same signature verification.
