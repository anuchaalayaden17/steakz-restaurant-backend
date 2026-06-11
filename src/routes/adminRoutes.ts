import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("ADMIN"));

router.get("/dashboard", async (req, res) => {
  try {
    const totalBranches = await prisma.branch.count();
    const totalUsers = await prisma.user.count();
    const totalRoles = await prisma.role.count();
    const totalMenuItems = await prisma.menuItem.count();
    const totalTables = await prisma.table.count();
    const totalCustomers = await prisma.customer.count();
    const totalOrders = await prisma.order.count();

    res.json({
      totalBranches,
      totalUsers,
      totalRoles,
      totalMenuItems,
      totalTables,
      totalCustomers,
      totalOrders,
      systemStatus: "Active",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin dashboard data",
      error,
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true, branch: true },
      orderBy: { userId: "asc" },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error });
  }
});

router.post("/users", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      roleId,
      branchId,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        roleId: Number(roleId),
        branchId: Number(branchId),
      },
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      roleId,
      branchId,
    } = req.body;

    const user = await prisma.user.update({
      where: { userId },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        roleId: Number(roleId),
        branchId: Number(branchId),
      },
    });

    res.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error,
    });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    await prisma.user.delete({ where: { userId } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error });
  }
});

router.get("/branches", async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { branchId: "asc" },
    });

    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch branches", error });
  }
});
router.put("/branches/:id", async (req, res) => {
  try {
    const branchId = Number(req.params.id);
    const { branchName, location, phoneNumber } = req.body;

    const branch = await prisma.branch.update({
      where: { branchId },
      data: {
        branchName,
        location,
        phoneNumber,
      },
    });

    res.json({
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update branch",
      error,
    });
  }
});
router.get("/roles", async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { roleId: "asc" },
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch roles", error });
  }
});

router.get("/menu-items", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { menuItemId: "asc" },
    });

    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch menu items", error });
  }
});

router.post("/menu-items", async (req, res) => {
  try {
    const { itemName, description, price, category, availabilityStatus } =
      req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        itemName,
        description,
        price: Number(price),
        category,
        availabilityStatus,
      },
    });

    const branches = await prisma.branch.findMany();

    for (const branch of branches) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          ingredientName: itemName,
          branchId: branch.branchId,
        },
      });

      if (!existingInventory) {
        await prisma.inventory.create({
          data: {
            ingredientName: itemName,
            quantityInStock: 20,
            unit: "pcs",
            branchId: branch.branchId,
          },
        });
      }
    }

    res.status(201).json({
      message: "Menu item created and inventory added automatically",
      menuItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create menu item",
      error,
    });
  }
});

router.put("/menu-items/:id", async (req, res) => {
  try {
    const menuItemId = Number(req.params.id);

    const {
      itemName,
      description,
      price,
      category,
      availabilityStatus,
    } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: {
        menuItemId,
      },
      data: {
        itemName,
        description,
        price: Number(price),
        category,
        availabilityStatus,
      },
    });

    res.json({
      message: "Menu item updated successfully",
      menuItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update menu item",
      error,
    });
  }
});

router.delete("/menu-items/:id", async (req, res) => {
  try {
    const menuItemId = Number(req.params.id);

    await prisma.menuItem.delete({
      where: {
        menuItemId,
      },
    });

    res.json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete menu item",
      error,
    });
  }
});

router.get("/inventory", async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { branch: true },
      orderBy: { inventoryId: "asc" },
    });

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory", error });
  }
});

router.post("/inventory", async (req, res) => {
  try {
    const { ingredientName, quantityInStock, unit, branchId } = req.body;

    const inventory = await prisma.inventory.create({
      data: {
        ingredientName,
        quantityInStock: Number(quantityInStock),
        unit,
        branchId: Number(branchId),
      },
    });

    res.status(201).json({
      message: "Inventory item created successfully",
      inventory,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create inventory item", error });
  }
});
router.put("/inventory/:id", async (req, res) => {
  try {
    const inventoryId = Number(req.params.id);

    const { ingredientName, quantityInStock, unit, branchId } = req.body;

    const inventory = await prisma.inventory.update({
      where: {
        inventoryId,
      },
      data: {
        ingredientName,
        quantityInStock: Number(quantityInStock),
        unit,
        branchId: Number(branchId),
      },
    });

    res.json({
      message: "Inventory item updated successfully",
      inventory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update inventory item",
      error,
    });
  }
});
router.delete("/inventory/:id", async (req, res) => {
  try {
    const inventoryId = Number(req.params.id);

    await prisma.inventory.delete({ where: { inventoryId } });

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete inventory item", error });
  }
});

router.get("/tables", async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      include: { branch: true },
      orderBy: { tableNumber: "asc" },
    });

    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tables", error });
  }
});

router.post("/tables", async (req, res) => {
  try {
    const { tableNumber, capacity, status, branchId } = req.body;

    const table = await prisma.table.create({
      data: {
        tableNumber: Number(tableNumber),
        capacity: Number(capacity),
        status,
        branchId: Number(branchId),
      },
    });
router.put("/tables/:id", async (req, res) => {
  try {
    const tableId = Number(req.params.id);

    const { tableNumber, capacity, status, branchId } = req.body;

    const table = await prisma.table.update({
      where: {
        tableId,
      },
      data: {
        tableNumber: Number(tableNumber),
        capacity: Number(capacity),
        status,
        branchId: Number(branchId),
      },
    });

    res.json({
      message: "Table updated successfully",
      table,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update table",
      error,
    });
  }
});
    res.status(201).json({ message: "Table created successfully", table });
  } catch (error) {
    res.status(500).json({ message: "Failed to create table", error });
  }
});

router.delete("/tables/:id", async (req, res) => {
  try {
    const tableId = Number(req.params.id);

    await prisma.table.delete({ where: { tableId } });

    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete table", error });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { customerId: "asc" },
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers", error });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email } = req.body;

    const customer = await prisma.customer.create({
      data: { firstName, lastName, phoneNumber, email },
    });

    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (error) {
    res.status(500).json({ message: "Failed to create customer", error });
  }
});
router.put("/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    const { firstName, lastName, phoneNumber, email } = req.body;

    const customer = await prisma.customer.update({
      where: {
        customerId,
      },
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
      },
    });

    res.json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update customer",
      error,
    });
  }
});
router.delete("/customers/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    await prisma.customer.delete({ where: { customerId } });

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete customer", error });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        branch: true,
        user: true,
        table: true,
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
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { branchId, userId, tableId, orderStatus, items } = req.body;

    const menuItems = await prisma.menuItem.findMany({
      where: {
        menuItemId: {
          in: items.map((item: any) => Number(item.menuItemId)),
        },
      },
    });

    const totalAmount = items.reduce((total: number, item: any) => {
      const menuItem = menuItems.find(
        (menu) => menu.menuItemId === Number(item.menuItemId)
      );

      return total + (menuItem ? menuItem.price * Number(item.quantity) : 0);
    }, 0);

    const order = await prisma.order.create({
      data: {
        branchId: Number(branchId),
        userId: Number(userId),
        tableId: Number(tableId),
        orderStatus,
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
        customer: true,
        branch: true,
        user: true,
        table: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to create order", error });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { orderId } });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error });
  }
});
router.post("/inventory/generate-from-menu", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany();
    const branches = await prisma.branch.findMany();

    let createdCount = 0;

    for (const branch of branches) {
      for (const menuItem of menuItems) {
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            ingredientName: menuItem.itemName,
            branchId: branch.branchId,
          },
        });

        if (!existingInventory) {
          await prisma.inventory.create({
            data: {
              ingredientName: menuItem.itemName,
              quantityInStock: 20,
              unit: "pcs",
              branchId: branch.branchId,
            },
          });

          createdCount++;
        }
      }
    }

    res.json({
      message: "Inventory generated successfully from menu items",
      createdItems: createdCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate inventory from menu",
      error,
    });
  }
});
export default router;