#!/bin/bash
# =============================================================================
# Knowledge Layer V2 — Deployment Script
# =============================================================================
# Run this script step-by-step (not all at once) to deploy the Knowledge Layer.
# Prerequisites: gcloud CLI authenticated, cloud-sql-proxy installed.
#
# GCP Project: ai-operating-system-490208
# Region: asia-south1
# Cloud SQL: bharatvarsh-website:us-central1:bharatvarsh-db
# Database: ai_os (user: ai_os_admin)
# =============================================================================

set -e

PROJECT_ID="ai-operating-system-490208"
REGION="asia-south1"
SA_CLOUD_RUN="ai-os-cloud-run@${PROJECT_ID}.iam.gserviceaccount.com"
SA_CLOUD_FUNCTIONS="ai-os-cloud-functions@${PROJECT_ID}.iam.gserviceaccount.com"
ARTIFACT_REGISTRY="asia-south1-docker.pkg.dev/${PROJECT_ID}/ai-os-images"
CLOUD_SQL_INSTANCE="bharatvarsh-website:us-central1:bharatvarsh-db"

echo "=== Knowledge Layer V2 Deployment ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# =============================================================================
# SPRINT 5A: RAG Primitives + Infrastructure
# =============================================================================

echo "--- Sprint 5A: RAG Primitives + Infrastructure ---"

# --- 5A-4: Store OPENAI_API_KEY in Secret Manager ---
echo ""
echo "Step 5A-4: Store OPENAI_API_KEY"
echo "  Run this command with your actual OpenAI API key:"
echo '  echo -n "sk-YOUR_KEY_HERE" | gcloud secrets create OPENAI_API_KEY \'
echo "    --project=${PROJECT_ID} --replication-policy=automatic --data-file=-"
echo ""
echo "  If the secret already exists, create a new version:"
echo '  echo -n "sk-YOUR_KEY_HERE" | gcloud secrets versions add OPENAI_API_KEY \'
echo "    --project=${PROJECT_ID} --data-file=-"
echo ""
read -p "Press Enter after storing OPENAI_API_KEY (or Ctrl+C to abort)..."

# --- 5A-4b: Store ANTHROPIC_API_KEY if not already stored ---
echo ""
echo "Step 5A-4b: Ensure ANTHROPIC_API_KEY is in Secret Manager"
echo "  (Needed for weekly summary and auto-connector pipelines)"
echo '  echo -n "sk-ant-YOUR_KEY_HERE" | gcloud secrets create ANTHROPIC_API_KEY \'
echo "    --project=${PROJECT_ID} --replication-policy=automatic --data-file=-"
echo ""
read -p "Press Enter after storing ANTHROPIC_API_KEY (or skip if already exists)..."

# --- 5A-5: Grant Secret Manager access ---
echo ""
echo "Step 5A-5: Grant Secret Manager access to service accounts"

# OPENAI_API_KEY
gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
    --project=${PROJECT_ID} \
    --member="serviceAccount:${SA_CLOUD_RUN}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || echo "  (Binding may already exist)"

gcloud secrets add-iam-policy-binding OPENAI_API_KEY \
    --project=${PROJECT_ID} \
    --member="serviceAccount:${SA_CLOUD_FUNCTIONS}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || echo "  (Binding may already exist)"

# ANTHROPIC_API_KEY
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
    --project=${PROJECT_ID} \
    --member="serviceAccount:${SA_CLOUD_RUN}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || echo "  (Binding may already exist)"

echo "  ✓ IAM bindings configured"

# --- 5A-1/2/3: Apply Migration 006 ---
echo ""
echo "Step 5A-1/2/3: Apply Migration 006"
echo "  1. Start cloud-sql-proxy in another terminal:"
echo "     cloud-sql-proxy ${CLOUD_SQL_INSTANCE} --port=5432"
echo "  2. Apply migration:"
echo "     psql -h localhost -U ai_os_admin -d ai_os -f database/migrations/006_knowledge_functions.sql"
echo ""
read -p "Press Enter after migration 006 is applied..."

# =============================================================================
# SPRINT 5B: Embedding Pipeline + Drive Scanner
# =============================================================================

echo ""
echo "--- Sprint 5B: Embedding Pipeline + Drive Scanner ---"

# --- 5B-1/2: Apply Migration 007 ---
echo ""
echo "Step 5B-1/2: Apply Migration 007"
echo "  psql -h localhost -U ai_os_admin -d ai_os -f database/migrations/007_knowledge_ingestion.sql"
echo ""
read -p "Press Enter after migration 007 is applied..."

# --- Apply seed 006 (pipelines + skill updates) ---
echo ""
echo "Step: Apply seed 006 (register pipelines + update skills)"
echo "  psql -h localhost -U ai_os_admin -d ai_os -f database/seeds/006_seed_knowledge_pipelines.sql"
echo ""
read -p "Press Enter after seed 006 is applied..."

# --- 5B-3/4/5: Deploy Embedding Generator ---
echo ""
echo "Step 5B-3/4/5: Deploy Embedding Generator"

cd workflows/category-b/embedding-generator

# Build and push
docker build --platform linux/amd64 -t ${ARTIFACT_REGISTRY}/embedding-generator:latest .
docker push ${ARTIFACT_REGISTRY}/embedding-generator:latest

# Deploy to Cloud Run
gcloud run deploy embedding-generator \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image=${ARTIFACT_REGISTRY}/embedding-generator:latest \
    --service-account=${SA_CLOUD_RUN} \
    --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
    --set-secrets="AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest" \
    --memory=256Mi \
    --min-instances=0 \
    --max-instances=1 \
    --no-allow-unauthenticated \
    --quiet

# Create Cloud Scheduler trigger (every 5 minutes)
EMBEDDING_URL=$(gcloud run services describe embedding-generator --project=${PROJECT_ID} --region=${REGION} --format="value(status.url)")
gcloud scheduler jobs create http embedding-generator-trigger \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --schedule="*/5 * * * *" \
    --uri="${EMBEDDING_URL}" \
    --http-method=POST \
    --oidc-service-account-email=${SA_CLOUD_RUN} \
    --quiet 2>/dev/null || echo "  (Scheduler job may already exist — update with 'gcloud scheduler jobs update http')"

echo "  ✓ Embedding Generator deployed"
cd ../../..

# --- 5B-6/7/8: Deploy Drive Knowledge Scanner ---
echo ""
echo "Step 5B-6/7/8: Deploy Drive Knowledge Scanner"

cd workflows/category-b/drive-knowledge-scanner

docker build --platform linux/amd64 -t ${ARTIFACT_REGISTRY}/drive-knowledge-scanner:latest .
docker push ${ARTIFACT_REGISTRY}/drive-knowledge-scanner:latest

gcloud run deploy drive-knowledge-scanner \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image=${ARTIFACT_REGISTRY}/drive-knowledge-scanner:latest \
    --service-account=${SA_CLOUD_RUN} \
    --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
    --set-secrets="AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_REFRESH_TOKEN=GOOGLE_REFRESH_TOKEN:latest" \
    --memory=256Mi \
    --min-instances=0 \
    --max-instances=1 \
    --no-allow-unauthenticated \
    --quiet

SCANNER_URL=$(gcloud run services describe drive-knowledge-scanner --project=${PROJECT_ID} --region=${REGION} --format="value(status.url)")
gcloud scheduler jobs create http drive-scanner-trigger \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --schedule="0 0 * * *" \
    --uri="${SCANNER_URL}" \
    --http-method=POST \
    --oidc-service-account-email=${SA_CLOUD_RUN} \
    --quiet 2>/dev/null || echo "  (Scheduler job may already exist)"

echo "  ✓ Drive Knowledge Scanner deployed"
cd ../../..

# =============================================================================
# SPRINT 5C: Weekly Summary Pipeline
# =============================================================================

echo ""
echo "--- Sprint 5C: Weekly Summary Pipeline ---"

cd workflows/category-b/weekly-knowledge-summary

docker build --platform linux/amd64 -t ${ARTIFACT_REGISTRY}/weekly-knowledge-summary:latest .
docker push ${ARTIFACT_REGISTRY}/weekly-knowledge-summary:latest

gcloud run deploy weekly-knowledge-summary \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image=${ARTIFACT_REGISTRY}/weekly-knowledge-summary:latest \
    --service-account=${SA_CLOUD_RUN} \
    --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
    --set-secrets="AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
    --memory=256Mi \
    --min-instances=0 \
    --max-instances=1 \
    --no-allow-unauthenticated \
    --quiet

SUMMARY_URL=$(gcloud run services describe weekly-knowledge-summary --project=${PROJECT_ID} --region=${REGION} --format="value(status.url)")
gcloud scheduler jobs create http weekly-summary-trigger \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --schedule="30 16 * * 0" \
    --uri="${SUMMARY_URL}" \
    --http-method=POST \
    --oidc-service-account-email=${SA_CLOUD_RUN} \
    --quiet 2>/dev/null || echo "  (Scheduler job may already exist)"

echo "  ✓ Weekly Knowledge Summary deployed (runs Sunday 22:00 IST)"
cd ../../..

# =============================================================================
# SPRINT 5D: Auto-Connection Discovery
# =============================================================================

echo ""
echo "--- Sprint 5D: Auto-Connection Discovery ---"

cd workflows/category-b/knowledge-auto-connector

docker build --platform linux/amd64 -t ${ARTIFACT_REGISTRY}/knowledge-auto-connector:latest .
docker push ${ARTIFACT_REGISTRY}/knowledge-auto-connector:latest

gcloud run deploy knowledge-auto-connector \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image=${ARTIFACT_REGISTRY}/knowledge-auto-connector:latest \
    --service-account=${SA_CLOUD_RUN} \
    --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
    --set-secrets="AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
    --memory=256Mi \
    --min-instances=0 \
    --max-instances=1 \
    --no-allow-unauthenticated \
    --quiet

CONNECTOR_URL=$(gcloud run services describe knowledge-auto-connector --project=${PROJECT_ID} --region=${REGION} --format="value(status.url)")
gcloud scheduler jobs create http auto-connector-trigger \
    --project=${PROJECT_ID} \
    --location=${REGION} \
    --schedule="30 17 * * 0" \
    --uri="${CONNECTOR_URL}" \
    --http-method=POST \
    --oidc-service-account-email=${SA_CLOUD_RUN} \
    --quiet 2>/dev/null || echo "  (Scheduler job may already exist)"

echo "  ✓ Knowledge Auto-Connector deployed (runs Sunday 23:00 IST)"
cd ../../..

# =============================================================================
# Redeploy MCP Gateway (with OpenAI support)
# =============================================================================

echo ""
echo "--- Redeploy MCP Gateway with semantic search ---"

cd mcp-servers/ai-os-gateway

docker build --platform linux/amd64 -t ${ARTIFACT_REGISTRY}/ai-os-gateway:latest .
docker push ${ARTIFACT_REGISTRY}/ai-os-gateway:latest

gcloud run deploy ai-os-gateway \
    --project=${PROJECT_ID} \
    --region=${REGION} \
    --image=${ARTIFACT_REGISTRY}/ai-os-gateway:latest \
    --service-account=${SA_CLOUD_RUN} \
    --add-cloudsql-instances=${CLOUD_SQL_INSTANCE} \
    --set-secrets="DB_PASSWORD=AI_OS_DB_PASSWORD:latest,API_KEY=MCP_GATEWAY_API_KEY:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_REFRESH_TOKEN=GOOGLE_REFRESH_TOKEN:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest" \
    --memory=512Mi \
    --min-instances=0 \
    --max-instances=2 \
    --allow-unauthenticated \
    --quiet

echo "  ✓ MCP Gateway redeployed with semantic search + OPENAI_API_KEY"
cd ../..

# =============================================================================
# Verification
# =============================================================================

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Deployed services:"
gcloud run services list --project=${PROJECT_ID} --region=${REGION} --format="table(name, status.url)"

echo ""
echo "Cloud Scheduler jobs:"
gcloud scheduler jobs list --project=${PROJECT_ID} --location=${REGION} --format="table(name, schedule, state)"

echo ""
echo "=== Manual Steps Remaining ==="
echo "1. Create Drive Knowledge/ folder structure (7 folders) via MCP Gateway"
echo "2. Upload seed docs from docs/knowledge-seed/ to Drive Knowledge/ folders"
echo "3. Trigger Drive scanner manually: curl -X POST \${SCANNER_URL} -H 'Authorization: Bearer \$(gcloud auth print-identity-token)'"
echo "4. Wait 5 min for embedding generator to run"
echo "5. Verify: psql -h localhost -U ai_os_admin -d ai_os -c 'SELECT COUNT(*) FROM knowledge_entries; SELECT COUNT(*) FROM knowledge_embeddings;'"
echo "6. Complete Claude.ai MCP connector linkage (manual UI step)"
echo "7. Run /update-project-state to generate PROJECT_STATE v5"
