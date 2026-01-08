# 🚀 Despliegue a Cloud Run

## Configuración rápida

### 1. Instalar Google Cloud CLI (si no lo tienes)

```bash
# macOS
brew install google-cloud-sdk

# O descarga desde:
# https://cloud.google.com/sdk/docs/install
```

### 2. Autenticarse (solo la primera vez)

```bash
gcloud auth login
gcloud auth application-default login
```

### 3. Configurar proyecto

```bash
gcloud config set project gen-lang-client-0594101039
```

### 4. Habilitar APIs necesarias (solo la primera vez)

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 5. Desplegar

```bash
# Opción A: Usar el script (recomendado)
./deploy.sh

# Opción B: Comando directo
gcloud run deploy chromaforge \
    --source . \
    --region us-west1 \
    --project gen-lang-client-0594101039 \
    --allow-unauthenticated \
    --port 8080
```

## Comandos útiles

### Ver servicios existentes
```bash
gcloud run services list --project gen-lang-client-0594101039
```

### Ver logs
```bash
gcloud run services logs read chromaforge --region us-west1 --project gen-lang-client-0594101039
```

### Ver URL del servicio
```bash
gcloud run services describe chromaforge --region us-west1 --project gen-lang-client-0594101039 --format 'value(status.url)'
```

### Abrir en navegador
```bash
open $(gcloud run services describe chromaforge --region us-west1 --project gen-lang-client-0594101039 --format 'value(status.url)')
```

## Variables de entorno (si las necesitas)

Si necesitas la API key de Gemini:

```bash
# Usando Secret Manager (recomendado)
echo -n "tu_api_key" | gcloud secrets create gemini-api-key --data-file=-

gcloud run deploy chromaforge \
    --source . \
    --region us-west1 \
    --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## Troubleshooting

### Error: "API not enabled"
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Error: "Permission denied"
```bash
gcloud auth login
gcloud auth application-default login
```

### Cambiar región
Edita `REGION` en `deploy.sh` o usa `--region` en el comando.

