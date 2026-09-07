-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE';
