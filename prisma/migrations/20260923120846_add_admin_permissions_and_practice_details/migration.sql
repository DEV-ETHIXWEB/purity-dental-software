-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "addressLine" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permissionOverrides" JSONB;
