-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "canMessageCareTeam" BOOLEAN NOT NULL DEFAULT false;

-- Patients who predate this column keep the messaging they already had:
-- before the column existed, every patient could use the Messages page, so
-- defaulting them to false would silently cut off live threads. Only
-- patients registered from here on start without access.
UPDATE "patients" SET "canMessageCareTeam" = true;
