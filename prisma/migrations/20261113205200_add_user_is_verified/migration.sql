-- Add an explicit activation flag while preserving the existing verification flow.
ALTER TABLE "User"
ADD COLUMN "is_verified" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "is_verified" = ("emailVerified" IS NOT NULL);
