import type { RequestHandler } from 'express';

export const post: RequestHandler = (req, res, next) => {
    return res.send('post user');
};

export const put: RequestHandler = (req, res, next) => {
  return res.send('put user');
};

export const patch: RequestHandler = (req, res, next) => {
  return res.send('patch user');
};

export const del: RequestHandler = (req, res, next) => {
  return res.send('delete user');
};

export const getOne: RequestHandler = (req, res, next) => {
  return res.send('get user');
};

export const getMany: RequestHandler = (req, res, next) => {
  return res.send('get many users');
};
