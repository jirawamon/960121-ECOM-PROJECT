require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const crypto = require("crypto");

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

const promptPayPhone = "0931498129";

const createAuthToken = (userId) => {
  const randomPart = crypto.randomBytes(24).toString("hex");
  return `${userId}.${randomPart}`;
};

const formatDateOnly = (value) => {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(value).slice(0, 10);
};

const formatUser = (user) => ({
  id: user.user_id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phoneRegion: user.phone_region || "TH",
  phoneNumber: user.phone_number || "",
  birthday: formatDateOnly(user.birthday),
});

let userProfileColumnsReady = false;
let userSavedItemsTableReady = false;

const ensureUserProfileColumns = async () => {
  if (userProfileColumnsReady) {
    return;
  }

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'User_account'
       AND COLUMN_NAME IN ('phone_region', 'phone_number', 'birthday')`
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
  const changes = [];

  if (!existingColumns.has("phone_region")) {
    changes.push("ADD COLUMN phone_region VARCHAR(8) NULL");
  }

  if (!existingColumns.has("phone_number")) {
    changes.push("ADD COLUMN phone_number VARCHAR(32) NULL");
  }

  if (!existingColumns.has("birthday")) {
    changes.push("ADD COLUMN birthday DATE NULL");
  }

  if (changes.length) {
    await pool.query(`ALTER TABLE \`User_account\` ${changes.join(", ")}`);
  }

  userProfileColumnsReady = true;
};

const ensureUserSavedItemsTable = async () => {
  if (userSavedItemsTableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`User_saved_item\` (
      saved_item_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      variant VARCHAR(255) NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      image_url TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY user_product_variant_unique (user_id, product_id, variant),
      INDEX user_saved_item_user_idx (user_id)
    )
  `);

  userSavedItemsTableReady = true;
};

const formatSavedItem = (item) => ({
  id: item.saved_item_id,
  userId: item.user_id,
  productId: item.product_id,
  name: item.product_name,
  variant: item.variant || "",
  price: Number(item.price) || 0,
  image: item.image_url || "",
  createdAt: item.created_at,
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const toInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const today = () => new Date().toISOString().slice(0, 10);

const getPromptPayAmountPath = (amount) => {
  const baht = amount / 100;
  return Number.isInteger(baht) ? String(baht) : baht.toFixed(2);
};

const createPromptPayPayment = ({ amount, currency }) => {
  const chargeId = `promptpay_${Date.now()}`;
  const amountPath = getPromptPayAmountPath(amount);

  return {
    id: chargeId,
    status: "pending",
    amount,
    currency,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    qr_image: `https://promptpay.io/${promptPayPhone}/${amountPath}.png`,
    demo: false,
    poll: false,
  };
};

app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        products_id AS id,
        products_name AS name,
        description,
        price,
        compare_price,
        stock,
        rating,
        review_count,
        is_active,
        image_url,
        category
      FROM Products
      WHERE is_active = true
      ORDER BY products_id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Failed to load products:", error);
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const [existingUsers] = await pool.query(
      "SELECT user_id FROM `User_account` WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_account` (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
      [firstName, lastName, email, password]
    );

    const user = {
      user_id: result.insertId,
      first_name: firstName,
      last_name: lastName,
      email,
    };

    res.status(201).json({
      success: true,
      user: formatUser(user),
      token: createAuthToken(user.user_id),
    });
  } catch (error) {
    console.error("Failed to register:", error);
    res.status(500).json({ message: "Failed to create account" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password." });
    }

    const [users] = await pool.query(
      "SELECT user_id, first_name, last_name, email, phone_region, phone_number, birthday FROM `User_account` WHERE email = ? AND password = ? LIMIT 1",
      [email, password]
    );

    if (!users.length) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      success: true,
      user: formatUser(users[0]),
      token: createAuthToken(users[0].user_id),
    });
  } catch (error) {
    console.error("Failed to login:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const [rows] = await pool.query(
      "SELECT user_id, first_name, last_name, email, phone_region, phone_number, birthday FROM `User_account` ORDER BY user_id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to load users:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const userId = toInteger(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "Valid user id is required." });
    }

    const [users] = await pool.query(
      "SELECT user_id, first_name, last_name, email, phone_region, phone_number, birthday FROM `User_account` WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(formatUser(users[0]));
  } catch (error) {
    console.error("Failed to load user profile:", error);
    res.status(500).json({ message: "Failed to load user profile" });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    await ensureUserProfileColumns();
    const userId = toInteger(req.params.id);
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = normalizeEmail(req.body.email);
    const phoneRegion = String(req.body.phoneRegion || "TH").trim().toUpperCase();
    const phoneNumber = String(req.body.phoneNumber || "").replace(/\D/g, "").slice(0, 20);
    const birthday = String(req.body.birthday || "").trim();
    const birthdayValue = birthday ? birthday.slice(0, 10) : null;

    if (!userId || !firstName || !lastName || !email) {
      return res.status(400).json({ message: "firstName, lastName, and email are required." });
    }

    const [emailUsers] = await pool.query(
      "SELECT user_id FROM `User_account` WHERE email = ? AND user_id <> ? LIMIT 1",
      [email, userId]
    );

    if (emailUsers.length) {
      return res.status(409).json({ message: "This email is already registered." });
    }

    await pool.query(
      "UPDATE `User_account` SET first_name = ?, last_name = ?, email = ?, phone_region = ?, phone_number = ?, birthday = ? WHERE user_id = ?",
      [firstName, lastName, email, phoneRegion, phoneNumber, birthdayValue, userId]
    );

    const [users] = await pool.query(
      "SELECT user_id, first_name, last_name, email, phone_region, phone_number, birthday FROM `User_account` WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ success: true, user: formatUser(users[0]) });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.patch("/api/users/:id/password", async (req, res) => {
  try {
    const userId = toInteger(req.params.id);
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const [users] = await pool.query(
      "SELECT user_id FROM `User_account` WHERE user_id = ? AND password = ? LIMIT 1",
      [userId, currentPassword]
    );

    if (!users.length) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    await pool.query(
      "UPDATE `User_account` SET password = ? WHERE user_id = ?",
      [newPassword, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update password:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

app.get("/api/users/:id/orders", async (req, res) => {
  try {
    const userId = toInteger(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "Valid user id is required." });
    }

    const [rows] = await pool.query(
      `SELECT checkout_id, user_id, cart_id, address_id, total_price, payment_type, status, created_at
       FROM \`User_checkout\`
       WHERE user_id = ?
       ORDER BY checkout_id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Failed to load user orders:", error);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/api/users/:id/saved-items", async (req, res) => {
  try {
    await ensureUserSavedItemsTable();
    const userId = toInteger(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "Valid user id is required." });
    }

    const [rows] = await pool.query(
      `SELECT saved_item_id, user_id, product_id, product_name, variant, price, image_url, created_at
       FROM \`User_saved_item\`
       WHERE user_id = ?
       ORDER BY updated_at DESC, saved_item_id DESC`,
      [userId]
    );

    res.json(rows.map(formatSavedItem));
  } catch (error) {
    console.error("Failed to load saved items:", error);
    res.status(500).json({ message: "Failed to load saved items" });
  }
});

app.post("/api/users/:id/saved-items", async (req, res) => {
  try {
    await ensureUserSavedItemsTable();
    const userId = toInteger(req.params.id);
    const productId = String(req.body.productId || req.body.product_id || "").trim();
    const productName = String(req.body.name || req.body.productName || req.body.product_name || "").trim();
    const variant = String(req.body.variant || "Favorite item").trim();
    const price = toNumber(req.body.price) || 0;
    const image = String(req.body.image || req.body.imageUrl || req.body.image_url || "").trim();

    if (!userId || !productId || !productName) {
      return res.status(400).json({ message: "user id, productId, and name are required." });
    }

    const [result] = await pool.query(
      `INSERT INTO \`User_saved_item\` (user_id, product_id, product_name, variant, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         product_name = VALUES(product_name),
         price = VALUES(price),
         image_url = VALUES(image_url),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, productId, productName, variant, price, image]
    );
    const savedItemId = result.insertId;
    const [rows] = await pool.query(
      `SELECT saved_item_id, user_id, product_id, product_name, variant, price, image_url, created_at
       FROM \`User_saved_item\`
       WHERE user_id = ? AND product_id = ? AND variant = ?
       LIMIT 1`,
      [userId, productId, variant]
    );

    res.status(savedItemId ? 201 : 200).json({
      success: true,
      item: rows[0] ? formatSavedItem(rows[0]) : null,
    });
  } catch (error) {
    console.error("Failed to save item:", error);
    res.status(500).json({ message: "Failed to save item" });
  }
});

app.delete("/api/users/:id/saved-items/:savedItemId", async (req, res) => {
  try {
    await ensureUserSavedItemsTable();
    const userId = toInteger(req.params.id);
    const savedItemId = toInteger(req.params.savedItemId);

    if (!userId || !savedItemId) {
      return res.status(400).json({ message: "Valid user id and saved item id are required." });
    }

    await pool.query(
      "DELETE FROM `User_saved_item` WHERE user_id = ? AND saved_item_id = ?",
      [userId, savedItemId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove saved item:", error);
    res.status(500).json({ message: "Failed to remove saved item" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const firstName = String(req.body.firstName || req.body.first_name || "").trim();
    const lastName = String(req.body.lastName || req.body.last_name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, email, and password are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_account` (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
      [firstName, lastName, email, password]
    );

    res.status(201).json({
      user_id: result.insertId,
      first_name: firstName,
      last_name: lastName,
      email,
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

app.get("/api/user-addresses", async (req, res) => {
  try {
    const userId = toInteger(req.query.user_id || req.query.userId);
    const sql = userId
      ? "SELECT * FROM `User_address` WHERE user_id = ? ORDER BY address_id DESC"
      : "SELECT * FROM `User_address` ORDER BY address_id DESC";
    const params = userId ? [userId] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to load addresses:", error);
    res.status(500).json({ message: "Failed to load addresses" });
  }
});

app.post("/api/user-addresses", async (req, res) => {
  try {
    const userId = toInteger(req.body.user_id || req.body.userId);
    const addressLine = String(req.body.address_line || req.body.addressLine || "").trim();
    const city = String(req.body.city || "").trim();
    const province = String(req.body.province || "").trim();
    const postalCode = String(req.body.postal_code || req.body.postalCode || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!userId || !addressLine || !city || !province || !postalCode || !phone) {
      return res.status(400).json({ message: "user_id, address_line, city, province, postal_code, and phone are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_address` (user_id, address_line, city, province, postal_code, phone) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, addressLine, city, province, postalCode, phone]
    );

    res.status(201).json({
      address_id: result.insertId,
      user_id: userId,
      address_line: addressLine,
      city,
      province,
      postal_code: postalCode,
      phone,
    });
  } catch (error) {
    console.error("Failed to create address:", error);
    res.status(500).json({ message: "Failed to create address" });
  }
});

app.get("/api/user-carts", async (req, res) => {
  try {
    const userId = toInteger(req.query.user_id || req.query.userId);
    const sql = userId
      ? "SELECT * FROM `User_cart` WHERE user_id = ? ORDER BY cart_id DESC"
      : "SELECT * FROM `User_cart` ORDER BY cart_id DESC";
    const params = userId ? [userId] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to load carts:", error);
    res.status(500).json({ message: "Failed to load carts" });
  }
});

app.post("/api/user-carts", async (req, res) => {
  try {
    const userId = toInteger(req.body.user_id || req.body.userId);
    const status = String(req.body.status || "active").trim();
    const createdAt = String(req.body.created_at || req.body.createdAt || today()).slice(0, 10);

    if (!userId || !status) {
      return res.status(400).json({ message: "user_id and status are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_cart` (user_id, status, created_at) VALUES (?, ?, ?)",
      [userId, status, createdAt]
    );

    res.status(201).json({
      cart_id: result.insertId,
      user_id: userId,
      status,
      created_at: createdAt,
    });
  } catch (error) {
    console.error("Failed to create cart:", error);
    res.status(500).json({ message: "Failed to create cart" });
  }
});

app.get("/api/user-cart-items", async (req, res) => {
  try {
    const cartId = toInteger(req.query.cart_id || req.query.cartId);
    const sql = cartId
      ? "SELECT * FROM `User_cart_item` WHERE cart_id = ? ORDER BY cart_item_id DESC"
      : "SELECT * FROM `User_cart_item` ORDER BY cart_item_id DESC";
    const params = cartId ? [cartId] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to load cart items:", error);
    res.status(500).json({ message: "Failed to load cart items" });
  }
});

app.post("/api/user-cart-items", async (req, res) => {
  try {
    const cartId = toInteger(req.body.cart_id || req.body.cartId);
    const productId = toInteger(req.body.product_id || req.body.productId);
    const quantity = toInteger(req.body.quantity);
    const unitPrice = toNumber(req.body.unit_price || req.body.unitPrice);

    if (!cartId || !productId || !quantity || unitPrice === null) {
      return res.status(400).json({ message: "cart_id, product_id, quantity, and unit_price are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_cart_item` (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
      [cartId, productId, quantity, unitPrice]
    );

    res.status(201).json({
      cart_item_id: result.insertId,
      cart_id: cartId,
      product_id: productId,
      quantity,
      unit_price: unitPrice,
    });
  } catch (error) {
    console.error("Failed to create cart item:", error);
    res.status(500).json({ message: "Failed to create cart item" });
  }
});

app.get("/api/user-checkouts", async (req, res) => {
  try {
    const userId = toInteger(req.query.user_id || req.query.userId);
    const sql = userId
      ? "SELECT * FROM `User_checkout` WHERE user_id = ? ORDER BY checkout_id DESC"
      : "SELECT * FROM `User_checkout` ORDER BY checkout_id DESC";
    const params = userId ? [userId] : [];
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to load checkouts:", error);
    res.status(500).json({ message: "Failed to load checkouts" });
  }
});

app.post("/api/user-checkouts", async (req, res) => {
  try {
    const userId = toInteger(req.body.user_id || req.body.userId);
    const cartId = toInteger(req.body.cart_id || req.body.cartId);
    const addressId = toInteger(req.body.address_id || req.body.addressId);
    const totalPrice = toNumber(req.body.total_price || req.body.totalPrice);
    const paymentType = String(req.body.payment_type || req.body.paymentType || "").trim();
    const status = String(req.body.status || "pending").trim();
    const createdAt = String(req.body.created_at || req.body.createdAt || today()).slice(0, 10);

    if (!userId || !cartId || !addressId || totalPrice === null || !paymentType || !status) {
      return res.status(400).json({ message: "user_id, cart_id, address_id, total_price, payment_type, and status are required." });
    }

    const [result] = await pool.query(
      "INSERT INTO `User_checkout` (user_id, cart_id, address_id, total_price, payment_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, cartId, addressId, totalPrice, paymentType, status, createdAt]
    );

    res.status(201).json({
      checkout_id: result.insertId,
      user_id: userId,
      cart_id: cartId,
      address_id: addressId,
      total_price: totalPrice,
      payment_type: paymentType,
      status,
      created_at: createdAt,
    });
  } catch (error) {
    console.error("Failed to create checkout:", error);
    res.status(500).json({ message: "Failed to create checkout" });
  }
});

app.post("/api/payments/promptpay", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const currency = String(req.body.currency || "THB").toUpperCase();

    if (!Number.isInteger(amount) || amount < 2000 || amount > 15000000) {
      return res.status(400).json({ message: "PromptPay amount must be between THB20.00 and THB150,000.00." });
    }

    if (currency !== "THB") {
      return res.status(400).json({ message: "PromptPay only supports THB." });
    }

    const charge = createPromptPayPayment({ amount, currency });
    res.json(charge);
  } catch (error) {
    console.error("Failed to create PromptPay payment:", error);
    res.status(500).json({ message: error.message || "Failed to create PromptPay payment" });
  }
});

app.get("/api/payments/promptpay/:id", (req, res) => {
  res.json({
    id: req.params.id,
    status: "pending",
    demo: true,
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
