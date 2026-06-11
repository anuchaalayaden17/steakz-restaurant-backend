import express from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("BM"));

const getBranchId = (req: AuthRequest) => {
  return req.user?.branchId;
};

const branchStaffRoles = ["BM", "CHEF", "CASHIER", "WAITER"];

router.get("/dashboard", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(404).json({
        message: "Branch manager branch not found",
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { branchId },
    });

    const orders = await prisma.order.findMany({
      where: { branchId },
      include: {
        table: true,
        payment: true,
        user: {
          include: {
            role: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        orderId: "desc",
      },
    });

    const inventory = await prisma.inventory.findMany({
      where: { branchId },
      orderBy: {
        inventoryId: "asc",
      },
    });

    const staff = await prisma.user.findMany({
      where: {
        branchId,
        role: {
          roleName: {
            in: branchStaffRoles,
          },
        },
      },
      include: {
        role: true,
      },
      orderBy: {
        userId: "asc",
      },
    });

    const tables = await prisma.table.findMany({
      where: { branchId },
      orderBy: {
        tableNumber: "asc",
      },
    });

    const paidOrders = orders.filter(
      (order) => order.orderStatus === "Paid"
    );

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const pendingOrders = orders.filter(
      (order) => order.orderStatus === "Pending"
    ).length;

    const completedOrders = orders.filter(
      (order) => order.orderStatus === "Completed"
    ).length;

    const lowStockItems = inventory.filter(
      (item) => Number(item.quantityInStock) <= 5
    );

    const staffPerformance = staff.map((staffMember) => {
      const staffOrders = orders.filter(
        (order) => order.userId === staffMember.userId
      );

      const staffPaidOrders = staffOrders.filter(
        (order) => order.orderStatus === "Paid"
      );

      const staffRevenue = staffPaidOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      return {
        userId: staffMember.userId,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        role: staffMember.role.roleName,
        totalOrders: staffOrders.length,
        paidOrders: staffPaidOrders.length,
        revenue: staffRevenue,
      };
    });

    res.json({
      branch,
      summary: {
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalStaff: staff.length,
        totalInventoryItems: inventory.length,
        totalTables: tables.length,
        lowStockItems: lowStockItems.length,
      },
      orders,
      inventory,
      staff,
      staffPerformance,
      tables,
      lowStockItems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load branch dashboard",
      error,
    });
  }
});

router.get("/orders", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(404).json({
        message: "Branch manager branch not found",
      });
    }

    const orders = await prisma.order.findMany({
      where: { branchId },
      include: {
        branch: true,
        table: true,
        user: true,
        payment: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        orderId: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch branch orders",
      error,
    });
  }
});

router.get("/inventory", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(404).json({
        message: "Branch manager branch not found",
      });
    }

    const inventory = await prisma.inventory.findMany({
      where: { branchId },
      orderBy: {
        inventoryId: "asc",
      },
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch branch inventory",
      error,
    });
  }
});

router.get("/staff", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(404).json({
        message: "Branch manager branch not found",
      });
    }

    const staff = await prisma.user.findMany({
      where: {
        branchId,
        role: {
          roleName: {
            in: branchStaffRoles,
          },
        },
      },
      include: {
        role: true,
      },
      orderBy: {
        userId: "asc",
      },
    });

    res.json(staff);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch branch staff",
      error,
    });
  }
});

router.get("/tables", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);

    if (!branchId) {
      return res.status(404).json({
        message: "Branch manager branch not found",
      });
    }

    const tables = await prisma.table.findMany({
      where: { branchId },
      orderBy: {
        tableNumber: "asc",
      },
    });

    res.json(tables);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch branch tables",
      error,
    });
  }
});
router.patch("/inventory/:id", async (req: AuthRequest, res) => {
  try {
    const branchId = getBranchId(req);
    const inventoryId = Number(req.params.id);
    const { quantityInStock } = req.body;

    if (!branchId) {
      return res.status(404).json({ message: "Branch manager branch not found" });
    }

    const item = await prisma.inventory.findFirst({
      where: { inventoryId, branchId },
    });

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const updatedItem = await prisma.inventory.update({
      where: { inventoryId },
      data: {
        quantityInStock: Number(quantityInStock),
        lastUpdated: new Date(),
      },
    });

    res.json({
      message: "Inventory updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update inventory item",
      error,
    });
  }
});
router.get("/menu-items", async (req: AuthRequest, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: {
        menuItemId: "asc",
      },
    });

    res.json(menuItems);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch menu items",
      error,
    });
  }
});

router.patch("/menu-items/:id/status", async (req: AuthRequest, res) => {
  try {
    const menuItemId = Number(req.params.id);
    const { availabilityStatus } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: {
        menuItemId,
      },
      data: {
        availabilityStatus,
      },
    });

    res.json({
      message: "Menu item availability updated successfully",
      menuItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update menu item availability",
      error,
    });
  }
});
export default router;