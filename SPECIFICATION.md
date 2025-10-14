# Spécification du site web et application mobile PumpfoilMap

## Objectif
Fournir une carte interactive des pontons de pumpfoil, enrichie par les adhérents, accessible en tant que site web et applications Android/iOS. L'application doit fonctionner sur AWS Lambda pour l'hébergement des fonctions backend.

## Fonctionnalités principales
- **Carte interactive** : Affichage de spots (marqueurs clusterisés) de pumpfoil et des associations sportives liées.
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
-  - Web: React Native Web via Expo (SSR/SEO à étudier plus tard)
- **Backend** :
-  - AWS Lambda (serverless) via API Gateway (REST) ou AppSync (GraphQL)
-  - Stockage des données : AWS DynamoDB (spots, associations, utilisateurs) ou Aurora Serverless
-  - Stockage des images : AWS S3 (+ CloudFront)
- **Authentification** : AWS Cognito
- **Déploiement** :
-  - Web: Expo Web (hébergement statique S3 + CloudFront)
-  - Mobile: builds Expo EAS pour iOS/Android

## Données affichées sur la carte
- Spots de pumpfoil (géolocalisation, nom, description, accessibilité, métadonnées)
- Associations sportives (nom, coordonnées, activités, membres)
// (heatmap retirée au profit de marqueurs clusterisés dans le prototype actuel)

## Cartographie et parité multi-plateforme
- Web: MapLibre GL JS (style minimal routes + fond ou style complet), clustering GeoJSON
- iOS/Android: @rnmapbox/maps avec clustering équivalent
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
