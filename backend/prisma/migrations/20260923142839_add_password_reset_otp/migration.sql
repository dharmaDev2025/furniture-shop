-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetOtp" TEXT,
ADD COLUMN     "resetOtpExpireAt" TIMESTAMP(3);
