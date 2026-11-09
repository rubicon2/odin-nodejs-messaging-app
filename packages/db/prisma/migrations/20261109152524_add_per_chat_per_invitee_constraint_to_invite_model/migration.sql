/*
  Warnings:

  - A unique constraint covering the columns `[chatId,inviteeId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invite_chatId_inviteeId_key" ON "Invite"("chatId", "inviteeId");
