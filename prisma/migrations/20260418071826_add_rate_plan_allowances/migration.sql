-- AlterTable
ALTER TABLE "RatePlan" ADD COLUMN "dataAllowanceGb" INTEGER;
ALTER TABLE "RatePlan" ADD COLUMN "videoCallMinutes" INTEGER;
ALTER TABLE "RatePlan" ADD COLUMN "voiceCallMinutes" INTEGER;

UPDATE "RatePlan"
SET
  "voiceCallMinutes" = 999999,
  "videoCallMinutes" = 300,
  "dataAllowanceGb" = 250
WHERE "id" = 'plan-skt-5gx';

UPDATE "RatePlan"
SET
  "voiceCallMinutes" = 999999,
  "videoCallMinutes" = 300,
  "dataAllowanceGb" = 110
WHERE "id" = 'plan-kt-choice';

UPDATE "RatePlan"
SET
  "voiceCallMinutes" = 999999,
  "videoCallMinutes" = 300,
  "dataAllowanceGb" = 150
WHERE "id" = 'plan-lgu-premier';
