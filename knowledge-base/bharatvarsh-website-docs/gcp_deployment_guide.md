# GCP DEPLOYMENT & INFRASTRUCTURE

The application is deployed on Google Cloud Platform (GCP) utilizing a fully automated CI/CD pipeline powered by **Google Cloud Build** and **Google Cloud Run**.

## 1. Containerization
The ecosystem uses Docker for containerization, explicitly documented in a `dockerfile` and a `cloudbuild.yaml`.

- **Next.js Web App**: Utilizes a multi-stage Dockerfile. It compiles a Next.js `standalone` output, building a minimal production image running as a non-root `nextjs` user.
- **Agent Service**: The separate LiveKit WebSocket backend is containerized individually into a parallel image (`bharatvarsh-agent`).

## 2. CI/CD Pipeline (Cloud Build)
The deployment is triggered automatically on pushes to the `main` or `staging` branches. The pipeline (`cloudbuild.yaml`) executes the following comprehensive workflow:

1. **Build Step**: Inlines environment variables, runs `npm ci`, generates the Prisma Client, and builds the Next.js target.
2. **Docker Build & Registry**: Compiles BOTH the main application and the `agent-service` Docker images, tagging them with the Git commit SHA, and pushing them to Google Artifact Registry.
3. **Canary Deployment (Cloud Run)**: 
   - Deploys the new revision to Cloud Run with `--no-traffic` to establish a canary build.
   - The instance maps Secrets directly from Google Cloud Secret Manager.
   - Database connection is established locally within the service container utilizing the `--add-cloudsql-instances` flag (Cloud SQL Auth Proxy).
4. **Traffic Splitting & Health Checks**:
   - The pipeline routes 10% of traffic to the newly built canary revision.
   - A health check queries `/api/health`. If the canary fails to return an HTTP 200 after retry attempts, the pipeline automatically rolls back 100% of traffic to the stable revision.
   - If successful, a "soak" period occurs (120 seconds), followed by a 50% traffic bump, up to an eventual 100% promotion.
5. **Agent Service Deployment**: Successfully un-throttles and redeploys the Voice AI agent to a separate Cloud Run instance.

## 3. Cloud Run Specifics
- **Serverless Architecture**: Cloud Run automatically scales based on HTTP traffic.
- **Agent Service Throttling**: The `agent-service` is explicitly deployed with the `--no-cpu-throttling` flag. Because it maintains persistent LiveKit WebSocket connections, CPU throttling would drop the active audio sessions.
- **Security & Secrets**: Secrets are isolated in Secret Manager and mapped seamlessly to the Cloud Run instances as environment variables without hardcoding.
