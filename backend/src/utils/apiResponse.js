/**
 * apiResponse.js
 *
 * Utility helpers that enforce a consistent JSON envelope across every
 * endpoint.  Controllers call these instead of res.json() directly so
 * the response shape never drifts.
 *
 * Success envelope:
 *   { success: true,  message, data, meta? }
 *
 * Error envelope:
 *   { success: false, message, errors? }
 */

/**
 * Send a successful response.
 *
 * @param {import('express').Response} res
 * @param {number}  statusCode  HTTP status (default 200)
 * @param {string}  message     Human-readable description
 * @param {*}       data        Payload (object, array, null)
 * @param {object}  [meta]      Optional pagination / extra metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 *
 * @param {import('express').Response} res
 * @param {number}   statusCode  HTTP status (default 500)
 * @param {string}   message     Human-readable description
 * @param {Array}    [errors]    Validation error details
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Convenience wrappers for the most common status codes.
 */
const created  = (res, message, data)         => sendSuccess(res, 201, message, data);
const ok       = (res, message, data, meta)   => sendSuccess(res, 200, message, data, meta);
const noContent = (res)                        => res.status(204).send();

const badRequest   = (res, message, errors)   => sendError(res, 400, message, errors);
const unauthorized = (res, message = 'Unauthorized') => sendError(res, 401, message);
const forbidden    = (res, message = 'Forbidden')    => sendError(res, 403, message);
const notFound     = (res, message = 'Not found')    => sendError(res, 404, message);
const conflict     = (res, message)                  => sendError(res, 409, message);
const serverError  = (res, message)                  => sendError(res, 500, message);

module.exports = {
  sendSuccess,
  sendError,
  created,
  ok,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
};
