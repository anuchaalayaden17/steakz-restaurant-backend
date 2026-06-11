import express from "express";
import prisma from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("CHEF", "BM"));

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

    res.status(201).json({
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create menu item", error });
  }
});

router.put("/menu-items/:id", async (req, res) => {
  try {
    const menuItemId = Number(req.params.id);
    const { itemName, description, price, category, availabilityStatus } =
      req.body;

    const existingItem = await prisma.menuItem.findUnique({
      where: { menuItemId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const menuItem = await prisma.menuItem.update({
      where: { menuItemId },
      data: {
        itemName: itemName ?? existingItem.itemName,
        description: description ?? existingItem.description,
        price: price !== undefined ? Number(price) : existingItem.price,
        category: category ?? existingItem.category,
        availabilityStatus:
          availabilityStatus ?? existingItem.availabilityStatus,
      },
    });

    res.json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    res.status(500).json({ message: "Failed to update menu item", error });
  }
});
router.delete("/menu-items/:id", async (req, res) => {
  try {
    const menuItemId = Number(req.params.id);

    if (!menuItemId) {
      return res.status(400).json({
        message: "Invalid menu item ID",
      });
    }

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
export default router;