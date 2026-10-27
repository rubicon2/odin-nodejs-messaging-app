import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { client as db } from '../../../src/db/client.mts';
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
