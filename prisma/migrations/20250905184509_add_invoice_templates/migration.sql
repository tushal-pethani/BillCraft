-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "public"."InvoiceTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyLogo" TEXT,
    "isTaxable" BOOLEAN NOT NULL DEFAULT false,
    "cgstRate" DOUBLE PRECISION,
    "sgstRate" DOUBLE PRECISION,
    "igstRate" DOUBLE PRECISION,
    "invoiceNumberStart" INTEGER NOT NULL DEFAULT 1,
    "invoiceNumberPrefix" TEXT NOT NULL DEFAULT 'INV',
    "pdfTemplate" TEXT NOT NULL DEFAULT 'classic',
    "primaryColor" TEXT NOT NULL DEFAULT '#667eea',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f7fafc',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InvoiceTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."InvoiceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvoiceTemplate" ADD CONSTRAINT "InvoiceTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
