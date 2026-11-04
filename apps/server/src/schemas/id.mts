import { client as db } from '../db/client.mjs';

const chatId = async (id: string) => {
  const chat = await db.chat.findUnique({
    where: {
      id,
    },
  });
  return chat !== null;
};

const inviteId = async (id: string) => {
  const invite = await db.invite.findUnique({
    where: {
      id,
    },
  });
  return invite !== null;
};

const messageId = async (id: string) => {
  const message = await db.message.findUnique({
    where: {
      id,
    },
  });
  return message !== null;
};

const userId = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });
  return user !== null;
};

export const refinements = {
  chatId,
  inviteId,
  messageId,
  userId,
};
