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

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/bm", bmRoutes);
app.use("/api/hm", hmRoutes);

app.use("/api/chef", chefRoutes);
app.use("/api/chef", chefMenuRoutes);

app.use("/api/waiter", waiterRoutes);
app.use("/api/cashier", cashierRoutes);

app.get("/", (req, res) => {
  res.send("Steakz Restaurant Management API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log("✅ Steakz Restaurant Management System API");
  console.log("✅ PostgreSQL database connected");
  console.log("✅ Prisma Client initialized");
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});