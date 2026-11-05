import { createRequest } from 'node-mocks-http';
import { describe, expect, it } from 'vitest';
import * as checkPermissions from '../../../src/ext/checkPermissions.mjs';

describe('canDeleteChat', () => {
  describe('given a request containing a user and resource', () => {
    it('returns true if user is the sole participant in the chat', () => {
      const req = createRequest({
        user: {
          id: '1',
        },
        resource: {
          participants: [
            {
              id: '1',
            },
          ],
        },
      });

      expect(checkPermissions.canDeleteChat(req)).toStrictEqual(true);
    });

    it('returns false if user is not a participant in the chat', () => {
      const req = createRequest({
        user: {
          id: '2',
        },
        resource: {
          participants: [
            {
              id: '1',
            },
          ],
        },
      });

      expect(checkPermissions.canDeleteChat(req)).toStrictEqual(false);
    });

    it('given a request with no user, throws an error', () => {
      const req = createRequest();
      expect(() => checkPermissions.canDeleteChat(req)).toThrow(
        'req.user is undefined',
      );
    });

    it('given a request with no resource, throws an error', () => {
      const req = createRequest({
        user: {},
      });
      expect(() => checkPermissions.canDeleteChat(req)).toThrow(
        'req.resource is undefined',
      );
    });
  });
});

describe('canUpdateChat', () => {
  describe('given a request containing a user and resource', () => {
    it('returns true if user is a participant in the chat', () => {
      const req = createRequest({
        user: {
          id: '1',
        },
        resource: {
          participants: [
            {
              id: '1',
            },
          ],
        },
      });

      expect(checkPermissions.canUpdateChat(req)).toStrictEqual(true);
    });

    it('returns false if user is not a participant in the chat', () => {
      const req = createRequest({
        user: {
          id: '2',
        },
        resource: {
          participants: [
            {
              id: '1',
            },
          ],
        },
      });

      expect(checkPermissions.canUpdateChat(req)).toStrictEqual(false);
    });

    it('given a request with no user, throws an error', () => {
      const req = createRequest();
      expect(() => checkPermissions.canUpdateChat(req)).toThrow(
        'req.user is undefined',
      );
    });

    it('given a request with no resource, throws an error', () => {
      const req = createRequest({
        user: {},
      });
      expect(() => checkPermissions.canUpdateChat(req)).toThrow(
        'req.resource is undefined',
      );
    });
  });
});

describe('canUpdateUser', () => {
  describe('given a request containing a user and resource', () => {
    it('returns true if user id and resource id are the same', () => {
      const req = createRequest({
        user: {
          id: '1',
        },
        resource: {
          id: '1',
        },
      });

      expect(checkPermissions.canUpdateUser(req)).toStrictEqual(true);
    });

    it('returns false if user id and resource id are not the same', () => {
      const req = createRequest({
        user: {
          id: '1',
        },
        resource: {
          id: '2',
        },
      });

      expect(checkPermissions.canUpdateUser(req)).toStrictEqual(false);
    });
  });

  it('given a request with no user, throws an error', () => {
    const req = createRequest();
    expect(() => checkPermissions.canUpdateUser(req)).toThrow(
      'req.user is undefined',
    );
  });

  it('given a request with no resource, throws an error', () => {
    const req = createRequest({
      user: {},
    });
    expect(() => checkPermissions.canUpdateUser(req)).toThrow(
      'req.resource is undefined',
    );
  });
});
