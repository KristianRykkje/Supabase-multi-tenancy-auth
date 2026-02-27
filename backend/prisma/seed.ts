import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo tenants
  const tenantA = await prisma.tenants.upsert({
    where: { slug: "tenant-a" },
    update: {},
    create: {
      name: "Tenant A",
      slug: "tenant-a",
    },
  });

  const tenantB = await prisma.tenants.upsert({
    where: { slug: "tenant-b" },
    update: {},
    create: {
      name: "Tenant B",
      slug: "tenant-b",
    },
  });

  console.log("✅ Created demo tenants:");
  console.log("  - Tenant A:", tenantA.slug);
  console.log("  - Tenant B:", tenantB.slug);

  console.log("\n🎉 Seeding complete!");
  console.log("\nYou can now test multi-tenant auth:");
  console.log("  - http://localhost:3000/tenant-a/signup");
  console.log("  - http://localhost:3000/tenant-b/signup");
  console.log("\nTry signing up with the same email on both tenants!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
