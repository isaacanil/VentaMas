# Producción
firebase deploy --only hosting:prod

# Staging permanente
firebase deploy --only hosting:staging

# cors google cloud storage
gcloud storage buckets update gs://ventamaxpos.appspot.com --cors-file=cors.json

# deploy commands 

# deploy production
npm run deploy:prod
# deploy staging
npm run deploy:staging
