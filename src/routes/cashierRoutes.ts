import express from "express";
import prisma from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roleAuth";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("CASHIER"));

router.get("/orders", async (req: AuthRequest, res) => {
  try {
    const cashierId = req.user?.userId;

    if (!cashierId) {
      return res.status(401).json({
        message: "Unauthorized cashier",
      });
    }

    const cashier = await prisma.user.findUnique({
      where: {
        userId: cashierId,
      },
    });

    if (!cashier || !cashier.branchId) {
      return res.status(404).json({
        message: "Cashier branch not found",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        branchId: cashier.branchId,
        orderStatus: {
          in: ["Completed", "Paid"],
        },
      },
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
      message: "Failed to fetch cashier orders",
      error,
    });
  }
});

router.get("/payments", async (req: AuthRequest, res) => {
  try {
    const cashierId = req.user?.userId;

    if (!cashierId) {
      return res.status(401).json({
        message: "Unauthorized cashier",
      });
    }

    const cashier = await prisma.user.findUnique({
      where: {
        userId: cashierId,
      },
    });

    if (!cashier || !cashier.branchId) {
      return res.status(404).json({
        message: "Cashier branch not found",
      });
    }

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          branchId: cashier.branchId,
        },
      },
      include: {
        order: {
          include: {
            branch: true,
            table: true,
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    res.json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payments",
      error,
    });
  }
});

router.post("/payments", async (req: AuthRequest, res) => {
  try {
    const cashierId = req.user?.userId;
    const { orderId, paymentMethod, paymentStatus } = req.body;

    if (!cashierId) {
      return res.status(401).json({
        message: "Unauthorized cashier",
      });
    }

    const cashier = await prisma.user.findUnique({
      where: {
        userId: cashierId,
      },
    });

    if (!cashier || !cashier.branchId) {
      return res.status(404).json({
        message: "Cashier branch not found",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        orderId: Number(orderId),
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.branchId !== cashier.branchId) {
      return res.status(403).json({
        message: "This order does not belong to your branch",
      });
    }

    if (order.payment) {
      return res.status(400).json({
        message: "This order already has a payment",
      });
    }

    if (!["Paid", "Failed", "Denied"].includes(paymentStatus)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: Number(orderId),
        paymentMethod,
        amount: Number(order.totalAmount),
        paymentStatus,
      },
    });

    if (paymentStatus === "Paid") {
      await prisma.order.update({
        where: {
          orderId: Number(orderId),
        },
        data: {
          orderStatus: "Paid",
        },
      });
    }

    res.status(201).json({
      message: "Payment processed successfully",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to process payment",
      error,
    });
  }
});

router.get("/receipts/:id", async (req: AuthRequest, res) => {
  try {
    const cashierId = req.user?.userId;
    const paymentId = Number(req.params.id);

    if (!cashierId) {
      return res.status(401).json({
        message: "Unauthorized cashier",
      });
    }

    const cashier = await prisma.user.findUnique({
      where: {
        userId: cashierId,
      },
    });

    if (!cashier || !cashier.branchId) {
      return res.status(404).json({
        message: "Cashier branch not found",
      });
    }

    const receipt = await prisma.payment.findUnique({
      where: {
        paymentId,
      },
      include: {
        order: {
          include: {
            branch: true,
            table: true,
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      return res.status(404).json({
        message: "Receipt not found",
      });
    }

    if (receipt.order.branchId !== cashier.branchId) {
      return res.status(403).json({
        message: "This receipt does not belong to your branch",
      });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch receipt",
      error,
    });
  }
});

export default router;