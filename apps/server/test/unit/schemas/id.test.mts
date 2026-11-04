import { beforeEach, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mjs';
import { refinements } from '../../../src/schemas/id.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mjs';

const validUUID = crypto.randomUUID();

beforeEach(dbHelpers.clearDb);

describe('refinements', () => {
  describe('chatId', () => {
    it('given the id of a chat that exists, returns true', async () => {
      const user = await db.user.create({
        data: dbUserData,
      });
      const chat = await db.chat.create({
        data: {
          createdBy: {
            connect: {
              id: user.id,
            },
          },
          title: 'My Chat Title',
        },
      });
      const result = await refinements.chatId(chat.id);

      expect(result).toStrictEqual(true);
    });

    it("given the id of a chat that doesn't exist, returns false", async () => {
      const result = await refinements.chatId('invalid-id');
      expect(result).toStrictEqual(false);
    });
  });

  describe('inviteId', () => {
    it('given the id of an invite that exists, returns true', async () => {
      const user = await db.user.create({
        data: dbUserData,
      });
      const chat = await db.chat.create({
        data: {
          createdBy: {
            connect: {
              id: user.id,
            },
          },
          title: 'My Chat Title',
        },
      });
      const invite = await db.invite.create({
        data: {
          createdBy: {
            connect: {
              id: user.id,
            },
          },
          chat: {
            connect: {
              id: chat.id,
            },
          },
          invitee: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      const result = await refinements.inviteId(invite.id);
      expect(result).toStrictEqual(true);
    });

    it("given the id of a invite that doesn't exist, returns false", async () => {
      const result = await refinements.inviteId('invalid-id');
      expect(result).toStrictEqual(false);
    });
  });

  describe('messageId', () => {
    it('given the id of a message that exists, returns true', async () => {
      const user = await db.user.create({
        data: dbUserData,
      });
      const chat = await db.chat.create({
        data: {
          createdBy: {
            connect: {
              id: user.id,
            },
          },
          title: 'My Chat Title',
        },
      });
      const message = await db.message.create({
        data: {
          sentBy: {
            connect: {
              id: user.id,
            },
          },
          chat: {
            connect: {
              id: chat.id,
            },
          },
          textContent: 'This is my amazing message',
        },
      });
      const result = await refinements.messageId(message.id);
      expect(result).toStrictEqual(true);
    });

    it("given the id of a message that doesn't exist, returns an error", async () => {
      const result = await refinements.chatId(validUUID);
      expect(result).toStrictEqual(false);
    });
  });

  describe('userId', () => {
    it('given the id of a user that exists, returns true', async () => {
      const user = await db.user.create({
        data: {
          ...dbUserData,
          // Override dbUserData id so it generates a uuid.
          id: undefined,
        },
      });
      const result = await refinements.userId(user.id);
      expect(result).toStrictEqual(true);
    });

    it("given the id of a user that doesn't exist, returns false", async () => {
      const result = await refinements.userId(validUUID);
      expect(result).toStrictEqual(false);
    });
  });
});
