#!/bin/bash

# Configuración
SERVICE_NAME="chromaforge"
REGION="us-west1"
PROJECT_ID="gen-lang-client-0594101039"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Desplegando ChromaForge a Cloud Run...${NC}"

# Verificar que gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI no está instalado.${NC}"
    echo "Instálalo desde: https://cloud.google.com/sdk/docs/install"
    echo "O en macOS: brew install google-cloud-sdk"
    exit 1
fi

# Configurar proyecto
echo -e "${YELLOW}📋 Configurando proyecto: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID

# Verificar servicios existentes
echo -e "${BLUE}🔍 Buscando servicios existentes...${NC}"
EXISTING_SERVICES=$(gcloud run services list --format="value(metadata.name)" --region=$REGION 2>/dev/null)

if [ ! -z "$EXISTING_SERVICES" ]; then
    echo -e "${YELLOW}Servicios encontrados en ${REGION}:${NC}"
    echo "$EXISTING_SERVICES"
    echo ""
    read -p "¿Usar uno de estos servicios? (deja vacío para crear/actualizar 'chromaforge'): " EXISTING_SERVICE
    if [ ! -z "$EXISTING_SERVICE" ]; then
        SERVICE_NAME=$EXISTING_SERVICE
    fi
fi

# Build y deploy
echo -e "${BLUE}📦 Construyendo y desplegando '${SERVICE_NAME}' en ${REGION}...${NC}"
echo -e "${YELLOW}⏳ Esto puede tardar unos minutos...${NC}"
echo ""

gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ¡Despliegue exitoso!${NC}"
    echo -e "${BLUE}🌐 URL del servicio:${NC}"
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)' 2>/dev/null)
    if [ ! -z "$SERVICE_URL" ]; then
        echo -e "${GREEN}$SERVICE_URL${NC}"
        echo ""
        echo -e "${YELLOW}💡 Comandos útiles:${NC}"
        echo "  Ver logs: gcloud run services logs read $SERVICE_NAME --region $REGION"
        echo "  Abrir en navegador: open $SERVICE_URL"
    else
        echo -e "${YELLOW}Ejecuta para ver la URL:${NC}"
        echo "gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
    fi
else
    echo -e "${RED}❌ Error en el despliegue${NC}"
    exit 1
fi

