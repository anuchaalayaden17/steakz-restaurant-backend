import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.userId,
        role: user.role.roleName,
        branchId: user.branchId,
      },
      process.env.JWT_SECRET || "steakz_secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role.roleName,
        branch: user.branch,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "steakz_secret"
    ) as {
      userId: number;
      role: string;
      branchId?: number;
    };

    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      include: {
        role: true,
        branch: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.roleName,
      branch: user.branch,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;