Règle: ne jamais faire de git push. Seul le mainteneur pousse sur le dépôt distant.

Règle: tout code doit être accompagné d'un test unitaire et d'un test E2E.

Règle: chaque changement doit passer le lint (npm run lint) sans avertissement ni erreur.

Règle: chaque changement doit faire passer tous les tests (npm test et npm run test:e2e).

- Frontend
  - src/App.tsx
  - src/components/Map/Map.web.tsx
  - src/components/Map/Map.tsx
  - src/components/Map/index.tsx
  - src/services/api.ts

- Backend
  - backend/src/handlers/
  - backend/src/lib/
  - backend/serverless.yml

- Tests
  - tests/e2e/
  - backend/test/
  - src/components/Map/__tests__/cities.render.test.tsx

- Config
  - package.json
  - backend/package.json
  - tsconfig.json
  - backend/tsconfig.json
  - playwright.config.ts

- Docs
  - README.md
  - SPECIFICATION.md
