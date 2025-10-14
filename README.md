# PumpfoilMap — Prototype Expo + Web

Base de code unique React Native (Expo) pour iOS/Android/Web, avec carte et marqueurs cliquables (sans Next.js).

## Démarrage rapide
```bash
npm install
# Web (Expo)
npm run web
# Mobile (environnements natifs requis)
npm run ios
npm run android
```

## Cartographie
- Web: MapLibre GL. Clustering des spots (cercles), popup avec titre / description / métadonnées. Mode minimal (routes principales + fond simplifié).
- Natif: @rnmapbox/maps. Clustering similaire et alertes natives sur appui.

## Structure
- `src/components/Map/Map.web.tsx` / `Map.native.tsx`: implémentations spécifiques (marqueurs cliquables)
- `src/App.tsx`: app RN commune
  

## Suite
- Intégration AWS (Cognito, API Gateway + Lambda, S3/CloudFront, DynamoDB)
- Authentification & rôles
- Optimisations performance (pagination, chargement différé)

## API backend (local)
- Base URL par défaut: `http://localhost:3000`
- Override possible via variable d’environnement Expo:
	- `EXPO_PUBLIC_API_BASE_URL`

## Tests backend et E2E
- Dans `backend/`:
	- Tests unitaires: `npm test`
	- E2E local (runner HTTP in-memory, sans Java/Docker): `npm run e2e:run`