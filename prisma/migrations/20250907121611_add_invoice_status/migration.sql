-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'UNPAID';
