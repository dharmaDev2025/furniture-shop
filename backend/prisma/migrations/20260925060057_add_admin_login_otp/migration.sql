-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adminLoginOtp" TEXT,
ADD COLUMN     "adminLoginOtpExpiresAt" TIMESTAMP(3);
