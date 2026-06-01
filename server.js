require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

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
