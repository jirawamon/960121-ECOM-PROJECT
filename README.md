# 960121 E-commerce Project

Minimal fashion e-commerce website with product cards loaded from a Railway MySQL database through a Node.js / Express backend.

## Requirements

Install these before running the website:

- Node.js
- npm
- Railway MySQL database

## Setup Before Running

1. Install project dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root.

The file must contain:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
PORT=3000
```

Example format only:

```env
DATABASE_URL=mysql://root:your-password@your-railway-host.rlwy.net:3306/railway
PORT=3000
```

Do not upload the real `.env` file to GitHub because it contains the database password.

3. Make sure the Railway MySQL database has a `products` table.

Required columns used by the website:

```txt
id
name
description
price
compare_price
stock
rating
review_count
is_active
image_url
category
```

4. Add product rows in Railway.

The `image_url` value should be a real image URL. If it is empty or set to a placeholder such as `xxx`, the product image will not show correctly.

## Run The Website

Start the local server:

```bash
npm start
```

Open the website:

```txt
http://localhost:3000
```

Product cards are loaded from:

```txt
http://localhost:3000/api/products
```

## Work Log

### 01/06/2026

What was done:

- Connected the website to Railway MySQL through a backend API.
- Added `server.js` using Node.js and Express.
- Used `mysql2` to connect to the Railway MySQL database.
- Used `dotenv` to load the database connection string from `.env`.
- Added `/api/products` endpoint to read product data from the `products` table.
- Updated `products.js` so product cards can be rendered from API data.
- Updated `app.js` to render products when the page loads.
- Fixed script paths in `index.html` from `client/js/...` to `js/...`.
- Added `.gitignore` to ignore `.env` and `node_modules/`.
- Installed npm dependencies and generated `package-lock.json`.

Tools / technologies used:

- HTML
- CSS
- JavaScript
- Node.js
- Express
- mysql2
- dotenv
- Railway MySQL

Current note:

- The API connection works.
- The database currently has product data.
- Product images need real `image_url` values in Railway to display correctly.

### 02/06/2026

What was done:

- Added backend API routes for the Login and Sign up system.
- Added `POST /api/register` for creating a new user account.
- Added `POST /api/login` for checking user email and password.
- Connected the Sign up form input from the UI to the backend API.
- Inserted new account data into the Railway MySQL `User_account` table.
- Checked for duplicate email before creating a new account.
- Returned user data and a simple login token after successful register/login.
- Updated the frontend form submit logic in `js/app.js` to call the real API instead of showing only demo success text.
- Added loading, success, and error messages for the account form.

Database table used:

```txt
User_account
```

Columns used:

```txt
user_id
first_name
last_name
email
password
```

API endpoints added:

```txt
POST /api/register
POST /api/login
```

Current note:

- The Login and Sign up system now uses backend SQL CRUD operations.
- Passwords are currently stored as plain text for simple classroom CRUD testing.
- For real production use, passwords should be changed to password hashes with bcrypt.
