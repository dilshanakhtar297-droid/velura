---
name: "Merge velura-starter into main"
about: "Merges the velura-starter branch into the main branch to publish the scaffolded Velura Gifts starter."
---

This pull request merges the complete Velura Gifts starter scaffold (web + api + docker-compose + seed data) from the velura-starter branch into the repository default branch (main).

What this PR includes:
- Next.js storefront (web/) with ProductViewer using react-three-fiber.
- Express API (api/) with Prisma, product endpoints, uploads presign/complete, Stripe checkout endpoints, webhook handler, authentication (bcrypt + JWT), and seed script.
- Docker Compose with Postgres and MinIO for local development.
- Admin UI (web/pages/admin) with product CRUD, file upload via presigned PUT, and orders list.

Run instructions are in README.md on the branch.
