# Spécification du site web et application mobile PumpfoilMap

## Objectif
Fournir une carte interactive des pontons de pumpfoil, enrichie par les adhérents, accessible en tant que site web et applications Android/iOS. L'application doit fonctionner sur AWS Lambda pour l'hébergement des fonctions backend.

## Fonctionnalités principales
- **Carte interactive** : Affichage d'une heatmap des spots de pumpfoil et des associations sportives liées.
- **Ajout et modification de spots** : Les adhérents peuvent proposer de nouveaux spots ou modifier les informations existantes (localisation, description, photos, niveau de difficulté, accessibilité, etc.).
- **Gestion des associations** : Présentation des associations sportives locales, avec possibilité de les contacter ou de rejoindre leurs activités.
- **Recherche et filtres** : Recherche par localisation, type de spot, niveau, association, etc.
- **Authentification** : Système d'inscription et de connexion pour les adhérents (email, réseaux sociaux).
- **Modération** : Validation des nouveaux spots et modifications par des modérateurs.
- **Responsive design** : Interface adaptée aux mobiles, tablettes et ordinateurs.
- **Progressive Web App (PWA)** : Fonctionnement hors-ligne partiel, installation sur mobile.
- **Applications natives** : Déploiement sur Android et iOS via wrappers (ex: React Native, Flutter).

-## Architecture technique
- **Frontend** :
-  - Base de code unique en React Native via Expo (iOS/Android/Web)
-  - Web: React Native Web + Next.js (SSR/SEO/PWA)
- **Backend** :
-  - AWS Lambda (serverless) via API Gateway (REST) ou AppSync (GraphQL)
-  - Stockage des données : AWS DynamoDB (spots, associations, utilisateurs) ou Aurora Serverless
-  - Stockage des images : AWS S3 (+ CloudFront)
- **Authentification** : AWS Cognito
- **Déploiement** :
-  - Web SSR: Next.js sur Lambda (Amplify Hosting SSR, AWS CDK/SST)
-  - Web statique: Next.js export -> S3 + CloudFront (si SSR/SEO non requis)
-  - Mobile: builds Expo EAS pour iOS/Android

## Données affichées sur la carte
- Spots de pumpfoil (géolocalisation, nom, description, photos, niveau, accessibilité)
- Associations sportives (nom, coordonnées, activités, membres)
- Heatmap par défaut affichant la densité des spots

## Cartographie et parité multi-plateforme
- Web: MapLibre GL JS (layer heatmap) avec style public
- iOS/Android: @rnmapbox/maps (SDK MapLibre/Mapbox) avec HeatmapLayer
- Abstraction `Map` avec implémentations spécifiques (`Map.web.tsx`, `Map.native.tsx`)

## Authentification et rôles
- AWS Cognito: utilisateurs (adhérents), modérateurs, admins
- Scopes: lecture publique des spots; ajout/édition avec compte; modération requise pour publication

## API (brouillon)
- POST /spots: proposer un spot
- GET /spots: liste paginée + filtres (bbox, type, difficulté)
- GET /heatmap: tuiles/agrégats pour densité
- PUT /spots/{id}: modification (modération)
- POST /media: upload S3 signé

## Observabilité & coûts
- CloudWatch Logs/metrics
- Alertes sur erreurs Lambda et temps de réponse
- Stratégie de cache CloudFront pour limiter le coût

## Sécurité et confidentialité
- Protection des données personnelles des adhérents
- RGPD et conformité locale

## Évolutivité
## Backend implémenté (MVP)
- Endpoints disponibles localement:
	- GET /spots (scan + filtre bbox en mémoire)
	- POST /spots (validation, statut pending)
- Stockage: DynamoDB (table Spots PAY_PER_REQUEST)
- Local: serverless-offline + dynamodb-local (Docker)
- TU: Jest sur handlers (validation, réponses, bbox)

## Développement local
Voir `backend/BACKEND-LOCAL.md` pour lancer et tester les endpoints en local (curl, seeds, tests unitaires).
- Ajout de nouvelles fonctionnalités (événements, météo, statistiques, etc.)
- Ouverture à d'autres sports nautiques
