import {
  chains as coreChains,
  fields as coreFields,
} from '@repo/schemas/invite';
import { refinements } from './id.mjs';

// These chains extend the @repo/schemas with server side checks.

const serverUser = coreFields.invitedUserId.refine(
  (invitedUserId) => refinements.userId(invitedUserId),
  'User does not exist',
);

const post = () =>
  coreChains.post.extend({
    invitedUserId: serverUser,
  });

export const fields = {
  serverUser,
};

export const chains = {
  post,
};
