import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { client as db } from '../../../src/db/client.mts';
import { createRefreshToken } from '../../../src/ext/tokens.mts';
import { env } from '../../../src/schemas/env.mts';
import { server } from '../../../src/server.mjs';
import * as dbHelpers from '../../helpers/db.mjs';
import { dbUserData } from '../../helpers/dbData.mts';
import { loginData } from '../../helpers/postData.mjs';

const baseUrl = '/v1/auth';

beforeAll(async () => {
  await dbHelpers.clearDb();
  await db.user.create({
    data: dbUserData,
  });
});

describe(`${baseUrl}/access`, () => {
  const url = `${baseUrl}/access`;

  describe('POST', () => {
    it('given a valid refresh cookie, returns status code 200 and an access token in the response body', async () => {
      const refresh = createRefreshToken(dbUserData);

      const response = await request(server)
        .post(url)
        .set('Cookie', [`refresh=${refresh}`]);

      expect(response.status).toStrictEqual(200);
      expect(response.body).toStrictEqual({
        status: 'success',
        data: {
          item: expect.any(String),
        },
      });
    });

    it('given a valid refresh cookie for a deleted user, returns status code 401 and a message', async () => {
      /**
       * If we implement a model/table for RevokedToken later, this test and the
       * corresponding code will no longer be necessary, since we will be able to
       * just revoke the token.
       */

      const userToDelete = await db.user.create({
        data: {
          ...dbUserData,
          id: 'delete-me',
          handle: 'delete_me',
        },
      });

      const refresh = createRefreshToken(userToDelete);

      await db.user.delete({
        where: {
          handle: userToDelete.handle,
        },
      });

      const response = await request(server)
        .post(url)
        .set('Cookie', [`refresh=${refresh}`]);

      expect(response.status).toStrictEqual(401);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'User does not exist',
      });
    });

    it('given an expired refresh cookie, returns status code 401 and a message', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);

      const refresh = createRefreshToken(dbUserData);

      vi.advanceTimersByTime(env.JWT_REFRESH_MAX_AGE);

      const response = await request(server)
        .post(url)
        .set('Cookie', [`refresh=${refresh}`]);

      expect(response.status).toStrictEqual(401);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'You are not logged in',
      });

      vi.useRealTimers();
    });

    it('given an invalid refresh cookie, returns status code 401 and a message', async () => {
      const response = await request(server)
        .post(url)
        .set('Cookie', [`refresh=whatever`]);

      expect(response.status).toStrictEqual(401);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'You are not logged in',
      });
    });

    it('given no cookies, returns status code 401 and a message', async () => {
      const response = await request(server).post(url);

      expect(response.status).toStrictEqual(401);
      expect(response.body).toStrictEqual({
        status: 'fail',
        message: 'You are not logged in',
      });
    });
  });
});

describe(`${baseUrl}/login`, () => {
  const url = `${baseUrl}/login`;

  describe('POST', () => {
    describe('given a valid handle and password', () => {
      it('returns status code 200 and an access token in the response body', async () => {
        const response = await request(server).post(url).send(loginData);

        expect(response.status).toStrictEqual(200);
        expect(response.body).toStrictEqual({
          status: 'success',
          message: 'Successfully logged in',
          data: {
            item: expect.any(String),
          },
        });
      });

      it('returns a secure, httpOnly set-cookie header with a refresh token', async () => {
        const response = await request(server).post(url).send(loginData);

        // For some reason, header type is string but actually returns string[].
        // Are the supertest or superagent types wrong or something?
        const cookieHeaders = response.headers[
          'set-cookie'
        ] as unknown as string[];
        expect(cookieHeaders).toBeDefined();

        const refreshCookie = cookieHeaders.find((cookieHeader) =>
          cookieHeader.includes('refresh'),
        );
        expect(refreshCookie).toBeDefined();
        expect(refreshCookie).toMatch(/^refresh=.*; HttpOnly; Secure/);
      });
    });
  });
});

describe(`${baseUrl}/logout`, () => {
  const url = `${baseUrl}/logout`;

  describe('POST', () => {
    it('returns status code 200 and a message in the body', async () => {
      const response = await request(server).post(url);

      expect(response.status).toStrictEqual(200);
      expect(response.body).toStrictEqual({
        status: 'success',
        message: 'Successfully logged out',
        data: {},
      });
    });

    it('returns a set-cookie header to clear the refresh cookie', async () => {
      const response = await request(server).post(url);

      const cookieHeaders = response.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(cookieHeaders).toBeDefined();

      const refreshCookie = cookieHeaders.find((cookieHeader) =>
        cookieHeader.includes('refresh'),
      );
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/^refresh=;/);
    });
  });
});
