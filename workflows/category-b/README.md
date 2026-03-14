# Category B — Scheduled Background Workflows

Each subdirectory is a self-contained Cloud Function.

## Structure per workflow:
```
workflow-name/
├── main.py          ← Cloud Function entry point
├── requirements.txt ← Python dependencies
├── config.py        ← Workflow-specific config
└── README.md        ← What it does, trigger schedule, cost estimate
```

## Deployment:
```bash
gcloud functions deploy FUNCTION_NAME \
  --runtime python312 \
  --trigger-http \
  --region asia-south1 \
  --entry-point main \
  --set-secrets 'ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest'
```

## Scheduling:
```bash
gcloud scheduler jobs create http JOB_NAME \
  --schedule="CRON_EXPRESSION" \
  --uri="FUNCTION_URL" \
  --http-method=POST \
  --oidc-service-account-email=SCHEDULER_SA@PROJECT.iam.gserviceaccount.com \
  --location=asia-south1
```

## Active Workflows:
- (none yet — Birthday Wishes is first)
