-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "circleTransactionId" TEXT,
ADD COLUMN "circleTransactionStatus" TEXT,
ADD COLUMN "circleTransactionType" TEXT,
ADD COLUMN "circleWalletId" TEXT,
ADD COLUMN "circleSourceAddress" TEXT,
ADD COLUMN "circleDestinationAddress" TEXT;
