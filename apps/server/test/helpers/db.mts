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
