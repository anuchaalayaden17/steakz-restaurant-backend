import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import publicRoutes from "./routes/publicRoutes";
import adminRoutes from "./routes/adminRoutes";
import bmRoutes from "./routes/bmRoutes";
import hmRoutes from "./routes/hmRoutes";
import chefRoutes from "./routes/chefRoutes";
import chefMenuRoutes from "./routes/chefMenuRoutes";
import waiterRoutes from "./routes/waiterRoutes";
import cashierRoutes from "./routes/cashierRoutes";

const app = express();

app.use(cors({
  origin: [
    process.env.FRONTEND_URL ?? "http://localhost:5173",
    "http://localhost:5173",
  ],
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Steakz Restaurant Management API Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bm", bmRoutes);
app.use("/api/hm", hmRoutes);
app.use("/api/chef", chefRoutes);
app.use("/api/chef", chefMenuRoutes);
app.use("/api/waiter", waiterRoutes);
app.use("/api/cashier", cashierRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(✅ Server running on port ${PORT});
});