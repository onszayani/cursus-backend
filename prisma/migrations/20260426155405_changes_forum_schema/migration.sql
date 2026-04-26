/*
  Warnings:

  - A unique constraint covering the columns `[creatorId,receiverType,receiverValue]` on the table `forum_threads` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverType` to the `forum_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverValue` to the `forum_threads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `forum_threads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "forum_messages" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "forum_threads" ADD COLUMN     "receiverId" TEXT,
ADD COLUMN     "receiverType" "MentionType" NOT NULL,
ADD COLUMN     "receiverValue" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "read_receipts" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "read_receipts_messageId_userId_key" ON "read_receipts"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_threads_creatorId_receiverType_receiverValue_key" ON "forum_threads"("creatorId", "receiverType", "receiverValue");

-- AddForeignKey
ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "forum_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "read_receipts" ADD CONSTRAINT "read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
