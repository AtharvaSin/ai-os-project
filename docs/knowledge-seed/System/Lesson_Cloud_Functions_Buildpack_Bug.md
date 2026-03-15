# Lesson Learned: Cloud Functions Gen 2 Buildpack Bug

## Context

The AI Operating System's Category B architecture was designed around Cloud Functions Gen 2 for scheduled pipelines. The first workload -- a Task Notification function that scans for overdue tasks and syncs to Google Tasks -- was built as a Cloud Function with an HTTP trigger intended to be invoked by Cloud Scheduler.

During deployment, the Cloud Functions Gen 2 buildpack creator process exited immediately without building the function. This was not specific to the Task Notification function -- it failed for all functions across all regions in the project.

## Decision / Content

### The Problem
- `gcloud functions deploy` with `--gen2` failed consistently
- The buildpack creator process exited with a non-descriptive error
- Tested with minimal hello-world functions -- same failure
- Tested across multiple regions (asia-south1, us-central1) -- same failure
- The issue appeared to be a platform-level bug in Cloud Functions Gen 2 buildpacks

### The Workaround
Instead of waiting for Google to fix the buildpack issue, the Task Notification service was repackaged as a Cloud Run service:

1. Wrapped the function code in a lightweight HTTP server using `functions-framework`
2. Created a Dockerfile (standard Python base image, not buildpack-based)
3. Deployed to Cloud Run with the same service account (ai-os-cloud-functions)
4. Configured Cloud Scheduler to invoke the Cloud Run URL with OIDC authentication

### The Result
- The service works identically to a Cloud Function from the caller's perspective
- Cloud Scheduler sends an HTTP POST at 06:00 IST daily
- The service scales to zero when not handling requests
- Cost impact: negligible (Cloud Run per-request billing matches Cloud Functions pricing)

### Root Cause (Suspected)
The buildpack issue was not resolved during the project timeline. It may be related to the project's Artifact Registry configuration or a regional Cloud Functions Gen 2 outage. The workaround is permanent unless Gen 2 buildpacks are confirmed working.

## Consequences

- **Practical impact:** All "Category B" scheduled workloads now deploy as Cloud Run services with Dockerfiles instead of Cloud Functions. This adds a small amount of boilerplate (Dockerfile, functions-framework dependency) but provides more control.
- **Architecture update:** Category B is no longer "Cloud Functions" in practice -- it is "Cloud Run services triggered by Cloud Scheduler." The category distinction (simple scheduled vs. complex agentic) remains valid.
- **Lesson:** Always have a containerized fallback path. Buildpacks are convenient but opaque -- when they fail, diagnosis is difficult.

## Related

- Decision: Three-Category Architecture (Category B definition affected)
- Decision: Scale-to-Zero Cloud Run (workaround uses the same pattern)
- Retro: Sprint 4 -- Deployment and CI/CD (bug discovered during this sprint)
- Reference: GCP Infrastructure (task-notification-daily service details)
