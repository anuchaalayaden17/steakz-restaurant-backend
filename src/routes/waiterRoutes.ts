import express from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("WAITER"));

router.get("/tables", async (req: AuthRequest, res) => {
  try {
    const waiterId = req.user?.userId;

    if (!waiterId) {
      return res.status(401).json({ message: "Unauthorized waiter" });
    }

    const waiter = await prisma.user.findUnique({
      where: { userId: waiterId },
    });

    if (!waiter || !waiter.branchId) {
      return res.status(404).json({ message: "Waiter branch not found" });
    }

    const tables = await prisma.table.findMany({
      where: { branchId: waiter.branchId },
      include: { branch: true },
      orderBy: { tableNumber: "asc" },
    });

    res.json(tables);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tables",
      error,
    });
  }
});

router.get("/menu-items", async (req: AuthRequest, res) => {
  try {
    const waiterId = req.user?.userId;

    if (!waiterId) {
      return res.status(401).json({ message: "Unauthorized waiter" });
    }

    const waiter = await prisma.user.findUnique({
      where: { userId: waiterId },
    });

    if (!waiter || !waiter.branchId) {
      return res.status(404).json({ message: "Waiter branch not found" });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { availabilityStatus: "Available" },
      orderBy: { menuItemId: "asc" },
    });

    const inventory = await prisma.inventory.findMany({
      where: { branchId: waiter.branchId },
    });

    const menuItemsWithStock = menuItems.map((menuItem) => {
      const inventoryItem = inventory.find(
        (item) => item.ingredientName === menuItem.itemName
      );

      const stock = inventoryItem ? inventoryItem.quantityInStock : 0;

      return {
        ...menuItem,
        stock,
        stockStatus:
          stock <= 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock",
      };
    });

    res.json(menuItemsWithStock);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch menu items",
      error,
    });
  }
});

router.get("/orders", async (req: AuthRequest, res) => {
  try {
    const waiterId = req.user?.userId;

    if (!waiterId) {
      return res.status(401).json({ message: "Unauthorized waiter" });
    }

    const waiter = await prisma.user.findUnique({
      where: { userId: waiterId },
    });

    if (!waiter || !waiter.branchId) {
      return res.status(404).json({ message: "Waiter branch not found" });
    }

    const orders = await prisma.order.findMany({
      where: { branchId: waiter.branchId },
      include: {
        branch: true,
        user: true,
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { orderId: "desc" },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch waiter orders",
      error,
    });
  }
});

router.post("/orders", async (req: AuthRequest, res) => {
  try {
    const { tableId, items } = req.body;
    const waiterId = req.user?.userId;

    if (!waiterId) {
      return res.status(401).json({ message: "Unauthorized waiter" });
    }

    const waiter = await prisma.user.findUnique({
      where: { userId: waiterId },
    });

    if (!waiter || !waiter.branchId) {
      return res.status(404).json({ message: "Waiter branch not found" });
    }

    const table = await prisma.table.findUnique({
      where: { tableId: Number(tableId) },
    });

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.branchId !== waiter.branchId) {
      return res.status(403).json({
        message: "This table does not belong to your branch",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        menuItemId: {
          in: items.map((item: any) => Number(item.menuItemId)),
        },
      },
    });

    for (const item of items) {
      const menuItem = menuItems.find(
        (menu) => menu.menuItemId === Number(item.menuItemId)
      );

      if (!menuItem) {
        return res.status(400).json({
          message: "Invalid menu item selected",
        });
      }

      const requestedQuantity = Number(item.quantity);

      if (requestedQuantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than zero",
        });
      }

      const inventoryItem = await prisma.inventory.findFirst({
        where: {
          ingredientName: menuItem.itemName,
          branchId: waiter.branchId,
        },
      });

      if (!inventoryItem) {
        return res.status(400).json({
          message: `${menuItem.itemName} is not available in this branch inventory`,
        });
      }

      if (inventoryItem.quantityInStock <= 0) {
        return res.status(400).json({
          message: `${menuItem.itemName} is out of stock`,
        });
      }

      if (inventoryItem.quantityInStock < requestedQuantity) {
        return res.status(400).json({
          message: `Not enough stock for ${menuItem.itemName}. Available stock: ${inventoryItem.quantityInStock}`,
        });
      }
    }

    const totalAmount = items.reduce((total: number, item: any) => {
      const menuItem = menuItems.find(
        (menu) => menu.menuItemId === Number(item.menuItemId)
      );

      return total + (menuItem ? menuItem.price * Number(item.quantity) : 0);
    }, 0);

    const order = await prisma.order.create({
      data: {
        branchId: waiter.branchId,
        userId: waiterId,
        tableId: Number(tableId),
        orderStatus: "Pending",
        totalAmount,
        orderItems: {
          create: items.map((item: any) => {
            const menuItem = menuItems.find(
              (menu) => menu.menuItemId === Number(item.menuItemId)
            );

            return {
              menuItemId: Number(item.menuItemId),
              quantity: Number(item.quantity),
              subtotal: menuItem ? menuItem.price * Number(item.quantity) : 0,
            };
          }),
        },
      },
      include: {
        branch: true,
        user: true,
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
    });

    for (const item of items) {
      const menuItem = menuItems.find(
        (menu) => menu.menuItemId === Number(item.menuItemId)
      );

      if (!menuItem) continue;

      const inventoryItem = await prisma.inventory.findFirst({
        where: {
          ingredientName: menuItem.itemName,
          branchId: waiter.branchId,
        },
      });

      if (inventoryItem) {
        await prisma.inventory.update({
          where: {
            inventoryId: inventoryItem.inventoryId,
          },
          data: {
            quantityInStock: {
              decrement: Number(item.quantity),
            },
            lastUpdated: new Date(),
          },
        });
      }
    }

    await prisma.table.update({
      where: { tableId: Number(tableId) },
      data: { status: "Occupied" },
    });

    res.status(201).json({
      message: "Order sent to kitchen",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create waiter order",
      error,
    });
  }
});

router.patch("/orders/:id/deliver", async (req: AuthRequest, res) => {
  try {
    const waiterId = req.user?.userId;
    const orderId = Number(req.params.id);

    if (!waiterId) {
      return res.status(401).json({ message: "Unauthorized waiter" });
    }

    const waiter = await prisma.user.findUnique({
      where: { userId: waiterId },
    });

    if (!waiter || !waiter.branchId) {
      return res.status(404).json({ message: "Waiter branch not found" });
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.branchId !== waiter.branchId) {
      return res.status(403).json({
        message: "This order does not belong to your branch",
      });
    }

    if (order.orderStatus !== "Ready") {
      return res.status(400).json({
        message: "Only ready orders can be delivered",
      });
    }

    await prisma.order.update({
      where: { orderId },
      data: { orderStatus: "Completed" },
    });

    await prisma.table.update({
      where: { tableId: order.tableId },
      data: { status: "Available" },
    });

    res.json({ message: "Order delivered successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to deliver order",
      error,
    });
  }
});

export default router;