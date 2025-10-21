# Déploiement et bootstrap d’infrastructure

Ce guide décrit les étapes administratives pour mettre en ligne PumpfoilMap: nom de domaine, certificat HTTPS, backend (Lambda + API Gateway + DynamoDB), frontend (hébergement web), clés et variables d’environnement, et opérations.

## 1) Prérequis
- Compte AWS (facturation activée). Utilisez le compte root UNIQUEMENT pour l’initialisation ci‑dessous, puis ne l’utilisez plus.
- Méthodes recommandées par AWS uniquement:
	- Local: AWS IAM Identity Center (ex‑AWS SSO) pour des identités humaines et des sessions temporaires via l’AWS CLI.
	- CI/CD: GitHub Actions OIDC pour assumer un rôle IAM (pas de clés longue durée dans GitHub).
- Outils: AWS CLI v2, Node.js LTS, npm, Serverless Framework. Région: eu-west-1.

Parcours pas‑à‑pas (novice) à partir d’un compte root:
1. Activer IAM Identity Center (SSO)
	 - Console AWS (root) > IAM Identity Center > Enable.
	 - Laissez le « AWS managed directory » par défaut (suffisant pour démarrer).

2. Créer un utilisateur Identity Center et un Permission Set
	 - Identity Center > Users > Add user (ex: « deployer »).
	 - Identity Center > Permission sets > Create permission set.
		 - Pour démarrer simplement: « AdministratorAccess » (vous réduirez ensuite à un jeu de permissions minimal). Note: bonnes pratiques = moindre privilège.

3. Attribuer l’utilisateur au compte AWS
	 - Identity Center > AWS accounts > [Votre compte] > Assign users or groups.
	 - Sélectionnez l’utilisateur « deployer » et le permission set.

4. Configurer l’AWS CLI avec SSO (local)
	 - Dans un terminal local:
		 - Exécutez: `aws configure sso`
		 - Suivez l’assistant (SSO start URL, région SSO, compte, permission set). Nommez le profil: `pumpfoilmap`.
		 - Connectez‑vous: `aws sso login --profile pumpfoilmap`.
		 - Vérifiez: `AWS_PROFILE=pumpfoilmap aws sts get-caller-identity` (doit afficher un rôle « sso » temporaire).

5. Créer l’identité OIDC GitHub et le rôle de déploiement (CI/CD)
	 - IAM > Identity providers > Add provider > OpenID Connect:
		 - Provider URL: `https://token.actions.githubusercontent.com`
		 - Audience: `sts.amazonaws.com`
	 - IAM > Roles > Create role > Web identity:
		 - Sélectionnez le provider `token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
		 - Ajoutez une condition de trust restreinte à votre dépôt/branche (ex: master).
		 - Attachez une politique de permissions pour déployer (temporairement `AdministratorAccess`, puis remplacez par une politique minimale pour CloudFormation/Lambda/APIGW/DynamoDB/Logs/S3/CloudFront/ACM/Route53 selon vos besoins).
		 - Nommez le rôle: `PumpfoilMapDeployer`.
	 - Exemple de trust policy (remplacez <ACCOUNT_ID>):
		 ```json
		 {
			 "Version": "2012-10-17",
			 "Statement": [
				 {
					 "Effect": "Allow",
					 "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
					 "Action": "sts:AssumeRoleWithWebIdentity",
					 "Condition": {
						 "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
						 "StringLike": {
							 "token.actions.githubusercontent.com:sub": "repo:MathieuAvila/pumpfoilmap:ref:refs/heads/master"
						 }
					 }
				 }
			 ]
		 }
		 ```

6. Configurer GitHub Actions (OIDC, sans clés)
	 - Dans `.github/workflows/deploy.yml`, donnez la permission id‑token et utilisez l’action officielle:
		 ```yaml
		 permissions:
			 id-token: write
			 contents: read

		 jobs:
			 deploy:
				 runs-on: ubuntu-latest
				 steps:
					 - uses: actions/checkout@v4
					 - uses: aws-actions/configure-aws-credentials@v4
						 with:
							 role-to-assume: arn:aws:iam::<ACCOUNT_ID>:role/PumpfoilMapDeployer
							 aws-region: eu-west-1
					 - name: Deploy backend
						 run: |
							 cd backend
							 npm ci
							 npx serverless deploy --stage prod
		 ```
	 - Important: n’ajoutez PAS de `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` dans les secrets GitHub. OIDC fournit des identités éphémères.

Notes sécurité (à appliquer dès que possible):
- Remplacez « AdministratorAccess » par une politique de moindre privilège restreinte à vos ressources (préfixes `pumpfoilmap-*`, ARNs ciblés, `iam:PassRole` limité aux rôles des Lambdas si nécessaire).
- Restreignez la trust policy par repo/branche ou par « environments » GitHub protégés.
- Le compte root ne doit plus être utilisé après le bootstrap. Utilisez Identity Center.

Annexe A — Politiques IAM « moindre privilège » prêtes à l’emploi

A.1 Politique Backend (Serverless/CloudFormation)
À attacher au rôle `PumpfoilMapDeployer` après le premier déploiement. Elle autorise la création/mise à jour des ressources backend utilisées par Serverless. Adaptez `<ACCOUNT_ID>` et, si possible, renommez vos ressources avec un préfixe `pumpfoilmap-` (déjà le cas pour DynamoDB/Lambda/Logs dans cette politique).

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "CloudFormationStacks",
			"Effect": "Allow",
			"Action": [
				"cloudformation:CreateStack",
				"cloudformation:UpdateStack",
				"cloudformation:DeleteStack",
				"cloudformation:CreateChangeSet",
				"cloudformation:ExecuteChangeSet",
				"cloudformation:DeleteChangeSet",
				"cloudformation:Describe*",
				"cloudformation:Get*",
				"cloudformation:List*",
				"cloudformation:TagResource",
				"cloudformation:UntagResource"
			],
			"Resource": [
				"arn:aws:cloudformation:*:<ACCOUNT_ID>:stack/pumpfoilmap-*/*",
				"arn:aws:cloudformation:*:<ACCOUNT_ID>:changeSet/pumpfoilmap-*/*"
			]
		},
		{
			"Sid": "LambdaFunctions",
			"Effect": "Allow",
			"Action": [
				"lambda:CreateFunction",
				"lambda:UpdateFunctionCode",
				"lambda:UpdateFunctionConfiguration",
				"lambda:DeleteFunction",
				"lambda:GetFunction",
				"lambda:PublishVersion",
				"lambda:CreateAlias",
				"lambda:UpdateAlias",
				"lambda:DeleteAlias",
				"lambda:TagResource",
				"lambda:UntagResource"
			],
			"Resource": "arn:aws:lambda:*:<ACCOUNT_ID>:function:pumpfoilmap-*"
		},
		{
			"Sid": "LogsForLambda",
			"Effect": "Allow",
			"Action": [
				"logs:CreateLogGroup",
				"logs:CreateLogStream",
				"logs:PutLogEvents",
				"logs:DescribeLogGroups",
				"logs:DescribeLogStreams",
				"logs:TagResource",
				"logs:UntagResource"
			],
			"Resource": [
				"arn:aws:logs:*:<ACCOUNT_ID>:log-group:/aws/lambda/pumpfoilmap-*",
				"arn:aws:logs:*:<ACCOUNT_ID>:log-group:/aws/lambda/pumpfoilmap-*:log-stream:*"
			]
		},
		{
			"Sid": "DynamoDBTables",
			"Effect": "Allow",
			"Action": [
				"dynamodb:CreateTable",
				"dynamodb:UpdateTable",
				"dynamodb:DeleteTable",
				"dynamodb:DescribeTable",
				"dynamodb:TagResource",
				"dynamodb:UntagResource"
			],
			"Resource": "arn:aws:dynamodb:*:<ACCOUNT_ID>:table/pumpfoilmap-*"
		},
		{
			"Sid": "ApiGatewayRest",
			"Effect": "Allow",
			"Action": [
				"apigateway:GET",
				"apigateway:POST",
				"apigateway:PUT",
				"apigateway:PATCH",
				"apigateway:DELETE"
			],
			"Resource": "arn:aws:apigateway:*::/restapis*"
		},
		{
			"Sid": "S3ServerlessArtifactsOptional",
			"Effect": "Allow",
			"Action": [
				"s3:CreateBucket",
				"s3:PutBucketTagging",
				"s3:PutBucketAcl",
				"s3:PutBucketPolicy",
				"s3:PutBucketPublicAccessBlock",
				"s3:PutEncryptionConfiguration",
				"s3:ListBucket",
				"s3:PutObject",
				"s3:GetObject",
				"s3:DeleteObject",
				"s3:DeleteBucket"
			],
			"Resource": [
				"arn:aws:s3:::pumpfoilmap-deploy-*",
				"arn:aws:s3:::pumpfoilmap-deploy-*/*"
			]
		},
		{
			"Sid": "IamForLambdaRoles",
			"Effect": "Allow",
			"Action": [
				"iam:CreateRole",
				"iam:DeleteRole",
				"iam:AttachRolePolicy",
				"iam:DetachRolePolicy",
				"iam:PutRolePolicy",
				"iam:DeleteRolePolicy",
				"iam:TagRole",
				"iam:UntagRole",
				"iam:GetRole",
				"iam:PassRole"
			],
			"Resource": "arn:aws:iam::<ACCOUNT_ID>:role/pumpfoilmap-*"
		}
	]
}
```

Remarques:
- La ressource API Gateway ne se restreint pas facilement par nom; ici elle est limitée à « /restapis » (nécessaire pour les stacks Serverless). Vous pouvez réduire au besoin une fois l’API créée (en ciblant l’ID de l’API).
- Pour S3 artefacts, nommez votre bucket de déploiement avec le préfixe `pumpfoilmap-deploy-` (ou ajustez l’ARN ci‑dessus) et configurez Serverless pour l’utiliser si vous souhaitez un contrôle strict.
- `iam:PassRole` est limité aux rôles commençant par `pumpfoilmap-`.

A.2 Politique Frontend (optionnelle — publication site web)
À attacher à un rôle dédié à la publication web si vous automatisez l’upload S3 + l’invalidation CloudFront. Remplacez `<DISTRIBUTION_ID>` et/ou restreignez à votre bucket.

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "WriteToWebsiteBucket",
			"Effect": "Allow",
			"Action": [
				"s3:ListBucket",
				"s3:PutObject",
				"s3:PutObjectAcl",
				"s3:DeleteObject",
				"s3:GetObject"
			],
			"Resource": [
				"arn:aws:s3:::pumpfoilmap-site-*",
				"arn:aws:s3:::pumpfoilmap-site-*/*"
			]
		},
		{
			"Sid": "CloudFrontInvalidation",
			"Effect": "Allow",
			"Action": [
				"cloudfront:CreateInvalidation",
				"cloudfront:GetInvalidation"
			],
			"Resource": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
		}
	]
}
```

Conseils de mise en place:
- Remplacez temporairement `AdministratorAccess` par ces politiques une fois le premier déploiement validé (ou utilisez‑les dès le début si vous avez fixé les préfixes/IDs des ressources).
- Ajoutez des tags (ex: `Project=pumpfoilmap`) à vos ressources; vous pourrez encore renforcer ces politiques avec des conditions `aws:ResourceTag/RequestTag`.

## 2) Nom de domaine et DNS (100% AWS)
- Route 53 > Domains > Register domain: acheter/transférer votre domaine.
- La Hosted Zone publique est créée automatiquement avec les NS.
- Enregistrements à créer (ou modifier après création de CloudFront/API):
	- `A`/`AAAA` (ALIAS) vers la distribution CloudFront du site web.
	- (optionnel) `api.votre-domaine.tld` (ALIAS) si vous configurez un domaine custom pour l’API Gateway.

## 3) Certificat HTTPS (ACM)
- Pour CloudFront: créez le certificat dans la région us-east-1 (N. Virginia). ACM > Request a certificate > domaine(s) (ex: `votre-domaine.tld`, `www.votre-domaine.tld`). Validation DNS.
- Pour API Gateway custom domain: créez le certificat ACM dans la région de l’API (ex: eu-west-1). Validation DNS.

## 4) Backend (Lambda + API Gateway + DynamoDB)
Le dossier `backend/` contient la config Serverless (`serverless.yml`). Le déploiement crée automatiquement la table DynamoDB, les Lambdas et l’API.

Variables d’environnement (exemples):
```bash
# Obligatoire
export AWS_REGION=eu-west-1
# Sécurité admin (à garder secret, utiliser SSM/Secrets Manager en prod)
export ADMIN_TOKEN=change-me-strong
# (Optionnel) Clé MapTiler côté frontend (voir section 5)
export EXPO_PUBLIC_MAPTILER_KEY=pk_xxx
# Base URL côté frontend (ajustez après déploiement backend)
export EXPO_PUBLIC_API_BASE_URL=https://api.votre-domaine.tld
```

Déployer le backend:
```bash
cd backend
npm ci
npx serverless deploy --stage prod
```
- Note: Serverless utilise CloudFormation. Sur succès, il affiche l’URL de l’API (ex: `https://xxxx.execute-api.eu-west-1.amazonaws.com/prod`).

Domaine custom pour l’API (optionnel):
- API Gateway > Custom domain names > Créez `api.votre-domaine.tld` en pointant sur le certificat ACM régional.
- Configurez un mapping vers votre stage (ex: `/` → `prod`).
- Route 53: enregistrement `A` alias vers l’API custom domain.

Initialiser les données (optionnel):
- Un fichier d’exemple existe: `backend/seeds/spots.json`.
- Vous pouvez écrire un petit script `batch-write-item` ou exposer une route d’admin pour charger ce JSON. Exemple minimal via AWS CLI:
```bash
aws dynamodb batch-write-item --request-items file://seeds/batch-write.json --region $AWS_REGION
```

Sécurité admin:
- Les endpoints d’admin exigent un header `Authorization: Bearer <ADMIN_TOKEN>`.
- En prod, stockez ce token dans AWS SSM Parameter Store/Secrets Manager et configurez-le via variables Serverless.

Logs et monitoring:
- CloudWatch Logs (groupes par fonction Lambda).
- (Optionnel) AWS X-Ray pour le tracing.

## 5) Frontend (site web) — Option unique: S3 + CloudFront
Le frontend web est fourni par Expo/React (dossier racine + `src/`).

Build web statique (exemple):
```bash
npm ci
# Build production web (adaptez selon votre flux: expo export web ou bundler)
npx expo export --platform web   # génère dist/ (Expo SDK >= 49)
```

Déploiement:
- Uploadez le contenu du dossier de build (ex: `dist/`) dans un bucket S3 (idéalement privé) et servez-le via CloudFront.
- CloudFront: créez une distribution, origine = S3, associez le certificat ACM (us-east-1), ajoutez le domaine (Alternate domain/CNAME).
- Route 53: créez l’enregistrement `A` (ALIAS) pointant vers la distribution CloudFront.

Variables côté frontend (prod): injectez via votre CI/CD au moment du build, ne les commitez pas.
```bash
EXPO_PUBLIC_API_BASE_URL=https://api.votre-domaine.tld
EXPO_PUBLIC_MAPTILER_KEY=pk_xxx  # Clé publique côté client, restreinte par domaine (voir §6)
```

## 6) Clés et secrets (production uniquement, bonnes pratiques)
Clés carto (MapTiler):
- Créez une clé: https://cloud.maptiler.com/account/keys/
- Restreignez la clé par domaine (référer `votre-domaine.tld`) et origine HTTP dans MapTiler.
- Injectez la clé au build via la CI/CD (variable `EXPO_PUBLIC_MAPTILER_KEY`). Ne la commitez pas.
- Note: c’est une clé côté client; la restriction par domaine est essentielle en prod.

Secrets backend (ex: ADMIN_TOKEN, autres):
- Stockez les secrets dans AWS Secrets Manager ou SSM Parameter Store (SecureString).
- Référencez-les dans `serverless.yml` via `${ssm:/path/to/param~true}` ou `${ssmSecure:...}` ou via `secretsManager`.
- Ne les exposez jamais au frontend (n’utilisez pas `EXPO_PUBLIC_*` pour ces valeurs).
- Idéal: remplacer le token admin par une authentification gérée (Cognito/OIDC) et des authorizers API Gateway.

## 7) Environnements (dev/staging/prod)
- Utilisez `--stage` pour isoler les stacks: `dev`, `staging`, `prod`.
- Variables d’environnement distinctes par stage (ADMIN_TOKEN, API base URL, etc.).
- Hébergement web distinct par environnement (sous-domaines ex: `staging.votre-domaine.tld`).

## 8) Développement local (offline)
DynamoDB local + Serverless offline:
```bash
# Donner des creds factices au SDK et une région
export AWS_ACCESS_KEY_ID=fake
export AWS_SECRET_ACCESS_KEY=fake
export AWS_REGION=eu-west-1
export AWS_EC2_METADATA_DISABLED=true

# Important: ajouter le protocole http://
DYNAMODB_ENDPOINT=http://localhost:8000 npx serverless offline --stage dev
```
- Frontend web local: `npm run web` (port défini dans package.json). Configurez `EXPO_PUBLIC_API_BASE_URL` pour pointer vers l’URL offline si besoin.

## 9) Sécurité et bonnes pratiques
- Stockez les secrets (ADMIN_TOKEN, clés) dans SSM/Secrets Manager, pas en clair dans le repo.
- Activez WAF/Rate limiting sur API Gateway/CloudFront.
- CORS: limitez les origines autorisées à vos domaines.
- Journaux: surveillez CloudWatch Logs, alarmes CloudWatch sur erreurs 5xx.
- Sauvegardes: activez Point-in-Time Recovery (PITR) sur DynamoDB.

## 10) Check-list de mise en prod
- [ ] Domaine et DNS opérationnels (Route 53 ou registrar externe).
- [ ] Certificat ACM validé (us-east-1 pour CloudFront, région API pour API Gateway).
- [ ] Backend déployé (serverless deploy), URL/API testée.
- [ ] (Option) Domaine custom API mappé et résolu.
- [ ] DynamoDB prêt (PITR activé), jeux de données initiaux chargés si besoin.
- [ ] Frontend hébergé (S3+CloudFront ou plateforme), variables `EXPO_PUBLIC_*` définies.
- [ ] Clé MapTiler active, cartes chargées sans 403.
- [ ] CORS/headers sécurité configurés.
- [ ] Monitoring/alerting CloudWatch en place.
- [ ] Token admin sécurisé et accessible uniquement aux personnes autorisées.
