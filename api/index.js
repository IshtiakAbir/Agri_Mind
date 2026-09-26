/**
 * Vercel Serverless Function entry point for AgriMind Express API.
 * Routes all /api/* requests directly into the Express application.
 */
const app = require('../app/backend/server');

module.exports = app;
