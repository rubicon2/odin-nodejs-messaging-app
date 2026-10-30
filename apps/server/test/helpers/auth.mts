import { client as db } from '../../src/db/client.mjs';
import { createAccessToken } from '../../src/ext/tokens.mts';
import { dbUserData } from './dbData.mts';

export function createBearerHeader(userData = dbUserData) {
  return `Bearer ${createAccessToken(userData)}`;
}

export async function createLoggedInUserAndGetBearerHeader(
  userData = dbUserData,
): Promise<string> {
  const user = await db.user.create({
    data: userData,
  });

  return createBearerHeader(user);
}
