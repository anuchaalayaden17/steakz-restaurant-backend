import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const roles = ["ADMIN", "HM", "BM", "CHEF", "CASHIER", "WAITER"];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {
        description: `${roleName} role`,
      },
      create: {
        roleName,
        description: `${roleName} role`,
      },
    });
  }

  const branchData = [
    {
      branchName: "Steakz London Central",
      location: "London Central",
      phoneNumber: "+44 20 5555 1001",
    },
    {
      branchName: "Steakz Manchester",
      location: "Manchester",
      phoneNumber: "+44 161 555 1002",
    },
    {
      branchName: "Steakz Liverpool",
      location: "Liverpool",
      phoneNumber: "+44 151 555 1003",
    },
    {
      branchName: "Steakz Birmingham",
      location: "Birmingham",
      phoneNumber: "+44 121 555 1004",
    },
    {
      branchName: "Steakz Leeds",
      location: "Leeds",
      phoneNumber: "+44 113 555 1005",
    },
    {
      branchName: "Steakz Bristol",
      location: "Bristol",
      phoneNumber: "+44 117 555 1006",
    },
    {
      branchName: "Steakz Glasgow",
      location: "Glasgow",
      phoneNumber: "+44 141 555 1007",
    },
  ];

  for (const branch of branchData) {
    await prisma.branch.upsert({
      where: { branchId: branchData.indexOf(branch) + 1 },
      update: {
        branchName: branch.branchName,
        location: branch.location,
        phoneNumber: branch.phoneNumber,
      },
      create: branch,
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { roleName: "ADMIN" } });
  const hmRole = await prisma.role.findUnique({ where: { roleName: "HM" } });
  const bmRole = await prisma.role.findUnique({ where: { roleName: "BM" } });
  const chefRole = await prisma.role.findUnique({ where: { roleName: "CHEF" } });
  const cashierRole = await prisma.role.findUnique({ where: { roleName: "CASHIER" } });
  const waiterRole = await prisma.role.findUnique({ where: { roleName: "WAITER" } });

  if (!adminRole || !hmRole || !bmRole || !chefRole || !cashierRole || !waiterRole) {
    throw new Error("Roles not found.");
  }

  const hashedPassword = await bcrypt.hash("12345678", 10);

  await prisma.user.upsert({
    where: { email: "admin@steakz.com" },
    update: {
      firstName: "System",
      lastName: "Administrator",
      password: hashedPassword,
      phoneNumber: "123498223",
      roleId: adminRole.roleId,
      branchId: 1,
    },
    create: {
      firstName: "System",
      lastName: "Administrator",
      email: "admin@steakz.com",
      password: hashedPassword,
      phoneNumber: "123498223",
      roleId: adminRole.roleId,
      branchId: 1,
    },
  });

  await prisma.user.upsert({
    where: { email: "hq.manager@steakz.com" },
    update: {
      firstName: "HQ",
      lastName: "Manager",
      password: hashedPassword,
      phoneNumber: "172283928",
      roleId: hmRole.roleId,
      branchId: null,
    },
    create: {
      firstName: "HQ",
      lastName: "Manager",
      email: "hq.manager@steakz.com",
      password: hashedPassword,
      phoneNumber: "172283928",
      roleId: hmRole.roleId,
      branchId: null,
    },
  });

  for (const branch of branchData) {
    const branchRecord = await prisma.branch.findFirst({
      where: { branchName: branch.branchName },
    });

    if (!branchRecord) continue;

    const city = branch.location.toLowerCase().replace(/\s+/g, ".");

    await prisma.user.upsert({
      where: { email: `bm.${city}@steakz.com` },
      update: {
        firstName: "Branch",
        lastName: `Manager ${branch.location}`,
        password: hashedPassword,
        phoneNumber: `111111${branchRecord.branchId}`,
        roleId: bmRole.roleId,
        branchId: branchRecord.branchId,
      },
      create: {
        firstName: "Branch",
        lastName: `Manager ${branch.location}`,
        email: `bm.${city}@steakz.com`,
        password: hashedPassword,
        phoneNumber: `111111${branchRecord.branchId}`,
        roleId: bmRole.roleId,
        branchId: branchRecord.branchId,
      },
    });

    await prisma.user.upsert({
      where: { email: `chef.${city}@steakz.com` },
      update: {
        firstName: "Chef",
        lastName: branch.location,
        password: hashedPassword,
        phoneNumber: `222222${branchRecord.branchId}`,
        roleId: chefRole.roleId,
        branchId: branchRecord.branchId,
      },
      create: {
        firstName: "Chef",
        lastName: branch.location,
        email: `chef.${city}@steakz.com`,
        password: hashedPassword,
        phoneNumber: `222222${branchRecord.branchId}`,
        roleId: chefRole.roleId,
        branchId: branchRecord.branchId,
      },
    });

    await prisma.user.upsert({
      where: { email: `cashier.${city}@steakz.com` },
      update: {
        firstName: "Cashier",
        lastName: branch.location,
        password: hashedPassword,
        phoneNumber: `333333${branchRecord.branchId}`,
        roleId: cashierRole.roleId,
        branchId: branchRecord.branchId,
      },
      create: {
        firstName: "Cashier",
        lastName: branch.location,
        email: `cashier.${city}@steakz.com`,
        password: hashedPassword,
        phoneNumber: `333333${branchRecord.branchId}`,
        roleId: cashierRole.roleId,
        branchId: branchRecord.branchId,
      },
    });

    await prisma.user.upsert({
      where: { email: `waiter.${city}@steakz.com` },
      update: {
        firstName: "Waiter",
        lastName: branch.location,
        password: hashedPassword,
        phoneNumber: `444444${branchRecord.branchId}`,
        roleId: waiterRole.roleId,
        branchId: branchRecord.branchId,
      },
      create: {
        firstName: "Waiter",
        lastName: branch.location,
        email: `waiter.${city}@steakz.com`,
        password: hashedPassword,
        phoneNumber: `444444${branchRecord.branchId}`,
        roleId: waiterRole.roleId,
        branchId: branchRecord.branchId,
      },
    });
  }

  const menuItems = [
    {
      itemName: "T-Bone Steak",
      description: "Premium grilled T-Bone steak served with herbs and garlic butter.",
      price: 29.99,
      category: "Steaks",
      availabilityStatus: "Available",
    },
    {
      itemName: "Ribeye Steak",
      description: "Juicy ribeye steak with a rich smoky steakhouse finish.",
      price: 27.99,
      category: "Steaks",
      availabilityStatus: "Available",
    },
    {
      itemName: "Sirloin Steak",
      description: "Tender sirloin steak prepared with our signature seasoning.",
      price: 23.99,
      category: "Steaks",
      availabilityStatus: "Available",
    },
    {
      itemName: "Filet Mignon",
      description: "The most tender premium steak, cooked to perfection.",
      price: 34.99,
      category: "Steaks",
      availabilityStatus: "Available",
    },
    {
      itemName: "Classic Burger",
      description: "Premium beef burger with cheddar, lettuce and steakhouse sauce.",
      price: 11.99,
      category: "Burgers",
      availabilityStatus: "Available",
    },
    {
      itemName: "Double Cheese Burger",
      description: "Double beef patty loaded with melted cheddar cheese.",
      price: 13.99,
      category: "Burgers",
      availabilityStatus: "Available",
    },
    {
      itemName: "BBQ Bacon Burger",
      description: "Smoky BBQ sauce, crispy bacon and premium beef.",
      price: 14.99,
      category: "Burgers",
      availabilityStatus: "Available",
    },
    {
      itemName: "Garlic Bread",
      description: "Toasted garlic bread with herbs and melted butter.",
      price: 4.99,
      category: "Sides",
      availabilityStatus: "Available",
    },
    {
      itemName: "French Fries",
      description: "Golden crispy fries served with steakhouse seasoning.",
      price: 3.99,
      category: "Sides",
      availabilityStatus: "Available",
    },
    {
      itemName: "Onion Rings",
      description: "Crunchy onion rings fried until golden brown.",
      price: 4.49,
      category: "Sides",
      availabilityStatus: "Available",
    },
    {
      itemName: "Chocolate Cake",
      description: "Rich chocolate dessert made for steakhouse lovers.",
      price: 6.99,
      category: "Desserts",
      availabilityStatus: "Available",
    },
    {
      itemName: "Cheesecake",
      description: "Creamy New York cheesecake with berry topping.",
      price: 5.99,
      category: "Desserts",
      availabilityStatus: "Available",
    },
    {
      itemName: "Chocolate Brownie",
      description: "Warm chocolate brownie served with chocolate drizzle.",
      price: 5.49,
      category: "Desserts",
      availabilityStatus: "Available",
    },
  ];

  for (const item of menuItems) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { itemName: item.itemName },
    });

    if (!existingItem) {
      await prisma.menuItem.create({
        data: item,
      });
    }
  }
  // Create 5 tables for each branch
  for (const branch of branchData) {
    const branchRecord = await prisma.branch.findFirst({
      where: { branchName: branch.branchName },
    });

    if (!branchRecord) continue;

    for (let tableNumber = 1; tableNumber <= 5; tableNumber++) {
      const existingTable = await prisma.table.findFirst({
        where: {
          tableNumber,
          branchId: branchRecord.branchId,
        },
      });

      if (!existingTable) {
        await prisma.table.create({
          data: {
            tableNumber,
            capacity: tableNumber <= 2 ? 2 : 4,
            status: "Available",
            branchId: branchRecord.branchId,
          },
        });
      }
    }
  }

  // Create inventory for every menu item in every branch
  const allMenuItems = await prisma.menuItem.findMany();
  const allBranches = await prisma.branch.findMany();

  for (const branch of allBranches) {
    for (const item of allMenuItems) {
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          ingredientName: item.itemName,
          branchId: branch.branchId,
        },
      });

      if (!existingInventory) {
        await prisma.inventory.create({
          data: {
            ingredientName: item.itemName,
            quantityInStock: 20,
            unit: "pcs",
            branchId: branch.branchId,
          },
        });
      }
    }
  }

  // Create sample customers
  const customerData = [
    {
      firstName: "John",
      lastName: "Smith",
      phoneNumber: "07123456789",
      email: "john.smith@example.com",
    },
    {
      firstName: "Sarah",
      lastName: "Johnson",
      phoneNumber: "07987654321",
      email: "sarah.johnson@example.com",
    },
    {
      firstName: "Michael",
      lastName: "Brown",
      phoneNumber: "07811223344",
      email: "michael.brown@example.com",
    },
  ];

  const customers = [];

  for (const customer of customerData) {
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: customer.email },
    });

    if (existingCustomer) {
      customers.push(existingCustomer);
    } else {
      const createdCustomer = await prisma.customer.create({
        data: customer,
      });

      customers.push(createdCustomer);
    }
  }

  // Create sample orders, order items and payments for London branch
  const londonBranch = await prisma.branch.findFirst({
    where: { location: "London Central" },
  });

  const londonWaiter = await prisma.user.findFirst({
    where: { email: "waiter.london.central@steakz.com" },
  });

  const londonTable1 = await prisma.table.findFirst({
    where: {
      branchId: londonBranch?.branchId,
      tableNumber: 1,
    },
  });

  const londonTable2 = await prisma.table.findFirst({
    where: {
      branchId: londonBranch?.branchId,
      tableNumber: 2,
    },
  });

  const tBoneSteak = await prisma.menuItem.findFirst({
    where: { itemName: "T-Bone Steak" },
  });

  const classicBurger = await prisma.menuItem.findFirst({
    where: { itemName: "Classic Burger" },
  });

  const frenchFries = await prisma.menuItem.findFirst({
    where: { itemName: "French Fries" },
  });

  if (
    londonBranch &&
    londonWaiter &&
    londonTable1 &&
    londonTable2 &&
    tBoneSteak &&
    classicBurger &&
    frenchFries &&
    customers.length >= 2
  ) {
    const existingPaidOrder = await prisma.order.findFirst({
      where: {
        branchId: londonBranch.branchId,
        tableId: londonTable1.tableId,
        orderStatus: "Paid",
      },
    });

    if (!existingPaidOrder) {
      const orderTotal = tBoneSteak.price + frenchFries.price;

      const order = await prisma.order.create({
        data: {
          customerId: customers[0].customerId,
          branchId: londonBranch.branchId,
          userId: londonWaiter.userId,
          tableId: londonTable1.tableId,
          orderStatus: "Paid",
          totalAmount: orderTotal,
          orderItems: {
            create: [
              {
                menuItemId: tBoneSteak.menuItemId,
                quantity: 1,
                subtotal: tBoneSteak.price,
              },
              {
                menuItemId: frenchFries.menuItemId,
                quantity: 1,
                subtotal: frenchFries.price,
              },
            ],
          },
        },
      });

      await prisma.payment.create({
        data: {
          paymentMethod: "Card",
          amount: orderTotal,
          paymentStatus: "Paid",
          orderId: order.orderId,
        },
      });
    }

    const existingCompletedOrder = await prisma.order.findFirst({
      where: {
        branchId: londonBranch.branchId,
        tableId: londonTable2.tableId,
        orderStatus: "Completed",
      },
    });

    if (!existingCompletedOrder) {
      const orderTotal = classicBurger.price + frenchFries.price;

      await prisma.order.create({
        data: {
          customerId: customers[1].customerId,
          branchId: londonBranch.branchId,
          userId: londonWaiter.userId,
          tableId: londonTable2.tableId,
          orderStatus: "Completed",
          totalAmount: orderTotal,
          orderItems: {
            create: [
              {
                menuItemId: classicBurger.menuItemId,
                quantity: 1,
                subtotal: classicBurger.price,
              },
              {
                menuItemId: frenchFries.menuItemId,
                quantity: 1,
                subtotal: frenchFries.price,
              },
            ],
          },
        },
      });
    }
  }
  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });