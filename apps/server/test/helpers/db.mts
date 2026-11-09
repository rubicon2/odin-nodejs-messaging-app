import type { Prisma } from '@repo/db/prisma/client';
import { client as db } from '../../src/db/client.mjs';

export async function clearUsers() {
  await db.user.deleteMany();
}

export async function clearChats() {
  await db.chat.deleteMany();
}

export async function clearMessages() {
  await db.message.deleteMany();
}

export async function clearInvites() {
  await db.invite.deleteMany();
}

export async function clearDb() {
  await clearInvites();
  await clearMessages();
  await clearChats();
  await clearUsers();
}

export async function postUser(data: Prisma.UserModel) {
  const user = await db.user.create({
    data,
  });
  return user;
}

export async function postChat(data: Prisma.ChatModel) {
  const chat = await db.chat.create({
    data,
  });
  return chat;
}

export async function addUserToChat(userId: string, chatId: string) {
  const updated = await db.chat.update({
    where: {
      id: chatId,
    },
    data: {
      participants: {
        connect: {
          id: userId,
        },
      },
    },
  });
  return updated;
}

export async function postInvite(data: Prisma.InviteModel) {
  const invite = await db.invite.create({
    data,
  });
  return invite;
}
