# LUXE Clothing Store

A full-stack e-commerce app for a clothing store. Node.js/Express backend with MongoDB, and a vanilla HTML/CSS/JS frontend. Deployed on Render.

---

## Stack
- **Backend** — Node.js, Express v5, MongoDB (Mongoose)
- **Auth** — JWT + bcryptjs, OTP password reset via email
- **Email** — Nodemailer (Gmail SMTP)
- **Frontend** — Static HTML/CSS/JS served from `/public`

---

## Features
- Customer shopping — browse products, cart, wishlist, place & cancel orders
- Order lifecycle — Pending → Processing → Shipped → Delivered
- Inventory — stock auto-deducted on order, restocked on cancel
- Finance ledger — income logged on order, expense logged on cancel/salary
- Employee management — admin creates staff accounts with salary tracking
- Newsletter — public subscribe, admin sends bulk emails
- Bulk product import — upload a CSV to insert many products at once
- Admin dashboard — sales totals, order counts, customer stats

---

## Roles
| Role | What they can do |
|------|-----------------|
| customer | Shop, manage cart/wishlist, place and cancel own orders |
| employee | Everything above + manage products, categories, update order status |
| admin | Everything + manage employees, payroll, finance, newsletter, dashboard |

To register as admin, pass `adminKey` matching `ADMIN_SECRET_KEY` in the register request.

---

## Project Structure
```
src/
  server.js          # Entry point
  config/db.js       # MongoDB connection
  middleware/        # Auth guards, error handler
  models/            # Mongoose schemas (User, Product, Order, Cart, Wishlist, Category, Finance, Newsletter)
  controllers/       # Business logic
  routes/            # Route definitions
  utils/             # JWT helper
public/              # Frontend static files
uploads/temp/        # Temp storage for CSV uploads (auto-cleaned)
```

---

## Environment Variables
Set these in Render dashboard (not in `.env` for production):

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | Auto-set by Render |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `ADMIN_SECRET_KEY` | Key to register admin accounts |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail app password |

> `MONGO_URI` must be a MongoDB Atlas URI — localhost won't work on Render.

---

## Running Locally
```bash
npm install
npm run dev
```

## Deploy (Render)
- Build command: *(none needed)*
- Start command: `node src/server.js`
