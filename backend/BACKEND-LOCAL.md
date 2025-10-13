# Backend local (Lambda + API Gateway + DynamoDB Local)

Prérequis
- Linux, Node.js LTS
- Docker (pour DynamoDB Local via plugin)

Installation
```bash
cd /home/mathieu/PUMPFOILMAP/backend
npm install
```

Démarrer en local (API + DynamoDB Local + seeds)
```bash
npm run dev
# API: http://localhost:3000
# DynamoDB Local: http://localhost:8000
```

Tester avec curl
```bash
# Lister les spots
curl -s http://localhost:3000/spots | jq

# Filtrer par bbox (minLng,minLat,maxLng,maxLat)
curl -s "http://localhost:3000/spots?bbox=2.0,48.0,3.0,49.0" | jq

# Créer un spot
curl -s -X POST http://localhost:3000/spots \
  -H "Content-Type: application/json" \
  -d '{"name":"Nouveau spot","lat":48.9,"lng":2.4,"description":"test"}' | jq
```

Tests unitaires
```bash
npm test
```

Arrêter DynamoDB Local
```bash
npm run dyn:stop
```

Notes
- Aucun identifiant AWS requis en mode local (serverless-offline + dynamodb-local).
- En cloud, la même config déploie la table et les Lambdas (`serverless deploy`).
