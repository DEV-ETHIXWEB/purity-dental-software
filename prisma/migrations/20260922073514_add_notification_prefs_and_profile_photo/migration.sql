-- AlterTable
ALTER TABLE "users" ADD COLUMN     "notificationPreferences" JSONB,
ADD COLUMN     "photoData" BYTEA,
ADD COLUMN     "photoMimeType" TEXT;
