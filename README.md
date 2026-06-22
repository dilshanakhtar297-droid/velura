# Velura Gifts — Starter

This repository contains a starter scaffold for Velura Gifts: a 3D e-commerce store with a Next.js storefront (react-three-fiber viewer) and an Express API with Prisma + PostgreSQL. It uses MinIO for local S3-compatible storage and Stripe in test mode.

What's included

- web/: Next.js frontend (TypeScript) with a ProductViewer component using @react-three/fiber and drei.
- api/: Express TypeScript server with Prisma schema and basic product endpoints.
- docker-compose.yml: Postgres and MinIO for local development.
- README with run instructions and env examples.

IMPORTANT: This is a starter scaffold. You must set secrets (Stripe keys, database URL, MinIO creds) in environment variables or GitHub secrets before running in production.

Default dev admin credentials (seeded):
- email: admin@veluragifts.test
- password: Password123!

Branch: velura-starter

