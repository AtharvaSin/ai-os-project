# Lesson Learned: Cloud Build IAM Permissions

## Context

During Sprint 4, the CI/CD pipeline for the MCP Gateway was established using Cloud Build triggers that auto-deploy on push to the main branch. The Cloud Build service account (ai-os-cicd) needed a specific set of IAM roles to build Docker images, push to Artifact Registry, deploy to Cloud Run, and access secrets. Several permission issues were encountered and resolved.

## Decision / Content

### The Problems Encountered

**Problem 1: Secret Manager Access**
Cloud Build steps that needed to read secrets (e.g., for environment variable substitution during builds) failed with permission denied errors. The ai-os-cicd service account initially lacked `secretmanager.secretAccessor` role.

**Fix:** Granted `roles/secretmanager.secretAccessor` to ai-os-cicd on the ai-operating-system-490208 project.

**Problem 2: Service Account Impersonation**
Cloud Build needed to deploy Cloud Run services that run as the ai-os-cloud-run service account. Without `iam.serviceAccountUser` role, Cloud Build could not set the runtime service account on the deployed service.

**Fix:** Granted `roles/iam.serviceAccountUser` to ai-os-cicd, allowing it to impersonate ai-os-cloud-run during deployment.

**Problem 3: Cross-Project Cloud SQL Access**
The Cloud Build process itself does not need direct database access, but the deployed Cloud Run services do. The cross-project IAM binding (cloudsql.client on bharatvarsh-website) had to be set on the runtime service accounts (ai-os-cloud-run, ai-os-cloud-functions), not on ai-os-cicd.

**Lesson:** Build-time and runtime IAM are separate concerns. Cloud Build needs Artifact Registry write + Cloud Run admin. The deployed service needs Cloud SQL client + Secret Manager accessor.

### Final IAM Configuration for ai-os-cicd
- `cloudbuild.builds.builder` -- Build and submit builds
- `run.admin` -- Deploy and manage Cloud Run services
- `cloudfunctions.developer` -- Deploy Cloud Functions (even though Gen 2 buildpacks are broken)
- `artifactregistry.writer` -- Push Docker images
- `iam.serviceAccountUser` -- Impersonate runtime service accounts during deployment
- `logging.logWriter` -- Write build logs
- `secretmanager.secretAccessor` -- Read secrets during build steps

### Best Practice Established
When setting up CI/CD for a new service:
1. Grant ai-os-cicd the deployment roles (run.admin, artifactregistry.writer)
2. Grant ai-os-cicd service account user role (to set runtime SA)
3. Grant the runtime service account its own roles (secretmanager, cloudsql.client)
4. Test the full build-deploy cycle before adding the trigger

## Consequences

- **Resolved:** All Cloud Build triggers now deploy successfully without permission errors
- **Pattern established:** New Cloud Run services follow the same IAM setup checklist
- **Lesson:** Always verify the full permission chain: build account -> artifact registry -> deployment target -> runtime account -> secrets/database. A missing link at any point causes cryptic failures.

## Related

- Retro: Sprint 4 -- Deployment and CI/CD (these issues were resolved during this sprint)
- Reference: GCP Infrastructure (final IAM configuration)
- Lesson: Cloud Functions Gen 2 Buildpack Bug (related deployment issue)
