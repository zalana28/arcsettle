import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ArcSettle database...\n");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.company.deleteMany();

  // Create Seller company
  const sellerPassword = await hash("password123", 12);
  const seller = await prisma.company.create({
    data: {
      name: "ArcSeller Inc.",
      email: "seller@arcsettle.dev",
      passwordHash: sellerPassword,
      countryCode: "US",
      industry: "Technology",
      kycStatus: "approved",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    },
  });
  console.log(`✅ Seller created: ${seller.name} (${seller.email})`);

  // Create Buyer company
  const buyerPassword = await hash("password123", 12);
  const buyer = await prisma.company.create({
    data: {
      name: "ArcBuyer Ltd.",
      email: "buyer@arcsettle.dev",
      passwordHash: buyerPassword,
      countryCode: "GB",
      industry: "Finance",
      kycStatus: "approved",
      walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    },
  });
  console.log(`✅ Buyer created: ${buyer.name} (${buyer.email})`);

  // Invoice 1: pending_approval
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-001",
      sellerId: seller.id,
      buyerId: buyer.id,
      amount: 5000.0,
      currency: "USDC",
      description: "Web development services - January 2026",
      dueDate: new Date("2026-06-15"),
      status: "pending_approval",
    },
  });
  console.log(`✅ Invoice created: ${invoice1.invoiceNumber} (pending_approval)`);

  // Invoice 2: approved
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-002",
      sellerId: seller.id,
      buyerId: buyer.id,
      amount: 12500.0,
      currency: "USDC",
      description: "Cloud infrastructure consulting - Q1 2026",
      dueDate: new Date("2026-05-30"),
      status: "approved",
      approvedAt: new Date("2026-05-10"),
    },
  });
  console.log(`✅ Invoice created: ${invoice2.invoiceNumber} (approved)`);

  // Invoice 3: settled with mock transaction
  const mockTxHash =
    "0x7a3b9c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b";
  const settlementFee = 75.0; // 0.5% of 15000

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-SEED-003",
      sellerId: seller.id,
      buyerId: buyer.id,
      amount: 15000.0,
      currency: "USDC",
      description: "API integration project - Phase 1 delivery",
      dueDate: new Date("2026-05-01"),
      status: "settled",
      approvedAt: new Date("2026-04-20"),
      settlementHash: mockTxHash,
      settlementDate: new Date("2026-04-22"),
      settlementFee: settlementFee,
    },
  });
  console.log(`✅ Invoice created: ${invoice3.invoiceNumber} (settled)`);

  // Create transaction record for settled invoice
  const transaction = await prisma.transaction.create({
    data: {
      invoiceId: invoice3.id,
      fromWallet: buyer.walletAddress!,
      toWallet: seller.walletAddress!,
      amount: 15000.0,
      currency: "USDC",
      chain: "arc_testnet",
      transactionHash: mockTxHash,
      status: "confirmed",
      gasPaidBy: "platform",
    },
  });
  console.log(`✅ Transaction created: ${transaction.transactionHash}`);

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        entityId: invoice1.id,
        entity: "invoice",
        action: "created",
        actor: seller.id,
        metadata: { invoiceNumber: invoice1.invoiceNumber, amount: 5000 },
      },
      {
        entityId: invoice2.id,
        entity: "invoice",
        action: "created",
        actor: seller.id,
        metadata: { invoiceNumber: invoice2.invoiceNumber, amount: 12500 },
      },
      {
        entityId: invoice2.id,
        entity: "invoice",
        action: "approved",
        actor: buyer.id,
      },
      {
        entityId: invoice3.id,
        entity: "invoice",
        action: "created",
        actor: seller.id,
        metadata: { invoiceNumber: invoice3.invoiceNumber, amount: 15000 },
      },
      {
        entityId: invoice3.id,
        entity: "invoice",
        action: "approved",
        actor: buyer.id,
      },
      {
        entityId: invoice3.id,
        entity: "invoice",
        action: "settled",
        actor: buyer.id,
        metadata: {
          transactionHash: mockTxHash,
          fee: settlementFee,
          chain: "arc_testnet",
        },
      },
    ],
  });
  console.log(`✅ Audit logs created (6 entries)`);

  console.log("\n🎉 Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Seller: seller@arcsettle.dev / password123");
  console.log("  Buyer:  buyer@arcsettle.dev / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
