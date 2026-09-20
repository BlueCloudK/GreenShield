# API Summary

All `/api` routes return JSON. Product routes require the HttpOnly session cookie unless noted.

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET|POST /api/projects`, `GET|PATCH|DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/targets`
- `PATCH /api/targets/:targetId`, `POST /api/targets/:targetId/test-connection`
- `GET /api/security-tests`
- `POST /api/scans`, `GET /api/scans/:scanId`
- `POST /api/findings/:findingId/retest`
- `GET /api/reports/:scanId`

The demo-target endpoint requires an internal header and is not a customer integration API.
