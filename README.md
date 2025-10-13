# PumpfoilMap — Prototype Expo + Web

Base de code unique React Native (Expo) pour iOS/Android/Web, avec heatmap cartographique.

## Démarrage rapide
```bash
npm install
# Web (Expo)
npm run web
# Web SSR (Next.js)
npm run next
# Mobile (environnements natifs requis)
npm run ios
npm run android
```

## Cartographie
- Web: MapLibre GL (style public). Heatmap via layer `heatmap`.
- Natif: @rnmapbox/maps (SDK MapLibre/Mapbox). Fournir un styleURL public; token facultatif si style self-hosted.

## Structure
- `src/components/Map/Map.web.tsx` / `Map.native.tsx`: implémentations spécifiques
- `src/App.tsx`: app RN commune
- `pages/`: Next.js (SSR)

## Suite
- Intégration AWS (Cognito, API Gateway + Lambda, S3/CloudFront, DynamoDB)
- Abstraction des services et ajout de l’authentification

## API backend (local)
- Base URL par défaut: `http://localhost:3000`
- Override possible via variables d’environnement:
	- Web/Next: `NEXT_PUBLIC_API_BASE_URL`
	- Expo: `EXPO_PUBLIC_API_BASE_URL`