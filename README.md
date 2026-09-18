# pickday

This repository is deployed as a Cloudflare Worker. GitHub is the source repository only; GitHub Pages is not used.

## Cloudflare setup

1. Create a D1 database named `pickday-db`.
2. Copy its database ID into `wrangler.toml` as `database_id`.
3. In Cloudflare Dashboard, open **Workers & Pages → Create application → Worker → Import from Git** (or **Workers Builds → Create build**), connect `lilyyolanda/pickday`, and select the `main` branch.
4. Use the repository root as the project root. The configuration file is `wrangler.toml` and the deploy command is `npx wrangler deploy`.
5. If the dashboard asks for a D1 binding, add one named `DB` and select `pickday-db`. The binding name must be exactly `DB`.
6. Run the SQL in `schema.sql` once against the production D1 database, or run `npm run db:migrate:remote` locally after installing dependencies.
7. Deploy. Subsequent pushes to `main` will trigger a new Worker deployment.

The Worker serves `index.html` and the other static assets, while `/api/todos` uses D1. Do not create or enable a GitHub Pages workflow for this repository.
