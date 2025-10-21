# DO NOT COMMIT


sudo docker ps -a
sudo docker container rm 316d98ee956c

sudo docker run -d --name dynamodb-local   -p 8000:8000   amazon/dynamodb-local:2.3.0 -jar DynamoDBLocal.jar -sharedDb -inMemory







export EXPO_PUBLIC_MAPTILER_KEY=SNxQ79BYcrNBpgYCI2v9
export EXPO_PUBLIC_ADMIN_TOKEN=dev
export DYNAMODB_ENDPOINT=http://localhost:8000
npm run web