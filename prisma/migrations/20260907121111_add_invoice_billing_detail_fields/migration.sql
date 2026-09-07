-- CreateEnum
CREATE TYPE "InvoicePaymentMethod" AS ENUM ('VISA', 'MASTERCARD', 'CARECREDIT', 'HSA', 'CASH');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "completedOnTime" BOOLEAN;

-- AlterTable
ALTER TABLE "invoice_line_items" ADD COLUMN     "quadrant" TEXT,
ADD COLUMN     "tooth" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "insuranceAdjustmentCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" "InvoicePaymentMethod",
ADD COLUMN     "paymentMethodLast4" TEXT,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "invoices_providerId_idx" ON "invoices"("providerId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
