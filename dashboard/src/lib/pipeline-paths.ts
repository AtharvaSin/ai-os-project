import path from 'path';

/**
 * Resolves the root directory of the Bharatvarsh content pipeline.
 *
 * Reads from CONTENT_PIPELINE_ROOT env var (set in Cloud Run via cloudbuild.yaml).
 * Falls back to the relative path from the dashboard directory for local dev.
 */
export function getContentPipelineRoot(): string {
  return (
    process.env.CONTENT_PIPELINE_ROOT ||
    path.join(process.cwd(), '..', 'content-pipelines', 'bharatvarsh')
  );
}
