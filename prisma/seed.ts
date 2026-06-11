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

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });