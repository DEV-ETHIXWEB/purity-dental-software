-- CreateEnum
CREATE TYPE "UserPresence" AS ENUM ('AVAILABLE', 'AWAY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "presence" "UserPresence" NOT NULL DEFAULT 'AVAILABLE';
