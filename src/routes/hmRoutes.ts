import express from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("HM"));

router.get("/dashboard", async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: true,
        orders: {
          include: {
            payment: true,
            table: true,
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        inventory: true,
        tables: true,
      },
      orderBy: {
        branchId: "asc",
      },
    });

    const allOrders = branches.flatMap((branch) => branch.orders);
    const allUsers = branches.flatMap((branch) => branch.users);

    const allInventory = branches.flatMap((branch) =>
      branch.inventory.map((item) => ({
        ...item,
        branchName: branch.branchName,
        location: branch.location,
      }))
    );

    const paidOrders = allOrders.filter(
      (order) => order.orderStatus === "Paid"
    );

    const lowStockItems = allInventory.filter(
      (item) => Number(item.quantityInStock) <= 5
    );

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const branchReports = branches.map((branch) => {
      const branchPaidOrders = branch.orders.filter(
        (order) => order.orderStatus === "Paid"
      );

      const branchRevenue = branchPaidOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      const branchLowStockItems = branch.inventory.filter(
        (item) => Number(item.quantityInStock) <= 5
      );

      return {
        branchId: branch.branchId,
        branchName: branch.branchName,
        location: branch.location,
        totalStaff: branch.users.length,
        totalOrders: branch.orders.length,
        paidOrders: branchPaidOrders.length,
        totalRevenue: branchRevenue,
        inventoryItems: branch.inventory.length,
        lowStockItems: branchLowStockItems.length,
        tables: branch.tables.length,
      };
    });

    const bestBranch =
      branchReports.length > 0
        ? branchReports.reduce((best, branch) =>
            branch.totalRevenue > best.totalRevenue ? branch : best
          )
        : null;

    const recentPaidOrders = allOrders
      .filter((order) => order.orderStatus === "Paid")
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
      .slice(0, 5);

    const topRevenueBranches = [...branchReports]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    res.json({
      summary: {
        totalBranches: branches.length,
        totalStaff: allUsers.length,
        totalOrders: allOrders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        lowStockItems: lowStockItems.length,
        bestBranch,
      },
      branchReports,
      recentPaidOrders,
      lowStockItems,
      topRevenueBranches,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load HQ dashboard",
      error,
    });
  }
});

router.get("/branches", async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: true,
        orders: true,
        inventory: true,
        tables: true,
      },
      orderBy: {
        branchId: "asc",
      },
    });

    res.json(branches);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch branches",
      error,
    });
  }
});

router.get("/reports", async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        orders: true,
        users: true,
        inventory: true,
        tables: true,
      },
      orderBy: {
        branchId: "asc",
      },
    });

    const report = branches.map((branch) => {
      const paidOrders = branch.orders.filter(
        (order) => order.orderStatus === "Paid"
      );

      const totalRevenue = paidOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      const lowStockItems = branch.inventory.filter(
        (item) => Number(item.quantityInStock) <= 5
      );

      return {
        branchId: branch.branchId,
        branchName: branch.branchName,
        location: branch.location,
        totalOrders: branch.orders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalStaff: branch.users.length,
        inventoryItems: branch.inventory.length,
        lowStockItems: lowStockItems.length,
        tables: branch.tables.length,
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate reports",
      error,
    });
  }
});

router.get("/inventory-overview", async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        branch: true,
      },
      orderBy: {
        quantityInStock: "asc",
      },
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch inventory overview",
      error,
    });
  }
});

export default router;