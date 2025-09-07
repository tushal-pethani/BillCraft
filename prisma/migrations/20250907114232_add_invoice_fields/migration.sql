-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "manualCgst" DOUBLE PRECISION,
ADD COLUMN     "manualIgst" DOUBLE PRECISION,
ADD COLUMN     "manualSgst" DOUBLE PRECISION,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "pdfData" BYTEA,
ADD COLUMN     "useManualGst" BOOLEAN NOT NULL DEFAULT false;
