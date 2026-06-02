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

const promptPayPhone = "0931498129";

const createAuthToken = (userId) => {
  const randomPart = crypto.randomBytes(24).toString("hex");
  return `${userId}.${randomPart}`;
};

const formatUser = (user) => ({
  id: user.user_id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

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
        id,
        name,
        description,
        price,
        compare_price,
        stock,
        rating,
        review_count,
        is_active,
        image_url,
        category
      FROM products
      WHERE is_active = true
      ORDER BY id DESC
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
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password." });
    }

    const [users] = await pool.query(
      "SELECT user_id, first_name, last_name, email FROM `User_account` WHERE email = ? AND password = ? LIMIT 1",
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
