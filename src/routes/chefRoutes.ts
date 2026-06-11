import express from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("CHEF"));

router.get("/orders", async (req: AuthRequest, res) => {
  try {
    const chefId = req.user?.userId;

    if (!chefId) {
      return res.status(401).json({
        message: "Unauthorized chef",
      });
    }

    const chef = await prisma.user.findUnique({
      where: {
        userId: chefId,
      },
    });

    if (!chef || !chef.branchId) {
      return res.status(404).json({
        message: "Chef branch not found",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        branchId: chef.branchId,
        orderStatus: {
          in: ["Pending", "Preparing", "Ready"],
        },
      },
      include: {
        branch: true,
        table: true,
        user: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch chef orders",
      error,
    });
  }
});

router.patch("/orders/:id/status", async (req: AuthRequest, res) => {
  try {
    const chefId = req.user?.userId;
    const orderId = Number(req.params.id);
    const { orderStatus } = req.body;

    if (!chefId) {
      return res.status(401).json({
        message: "Unauthorized chef",
      });
    }

    const chef = await prisma.user.findUnique({
      where: {
        userId: chefId,
      },
    });

    if (!chef || !chef.branchId) {
      return res.status(404).json({
        message: "Chef branch not found",
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        orderId,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (existingOrder.branchId !== chef.branchId) {
      return res.status(403).json({
        message: "This order does not belong to your branch",
      });
    }

    if (!["Pending", "Preparing", "Ready"].includes(orderStatus)) {
      return res.status(400).json({
        message: "Invalid order status for chef",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        orderId,
      },
      data: {
        orderStatus,
      },
      include: {
        branch: true,
        table: true,
        user: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update order status",
      error,
    });
  }
});

export default router;