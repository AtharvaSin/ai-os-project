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
  --service-account ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com \
  --set-secrets 'ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest,AI_OS_DB_INSTANCE=AI_OS_DB_INSTANCE:latest'
```

## Database Connection (Cloud SQL):
Cloud Functions can't use the Auth Proxy sidecar. Use `cloud-sql-python-connector` instead:

**Add to `requirements.txt`:**
```
cloud-sql-python-connector[pg8000]
```

**Connection pattern:**
```python
from google.cloud.sql.connector import Connector
import pg8000
import os

def get_db_connection():
    connector = Connector()
    conn = connector.connect(
        os.environ["AI_OS_DB_INSTANCE"],
        "pg8000",
        user="ai_os_admin",
        password=os.environ["AI_OS_DB_PASSWORD"],
        db="ai_os",
    )
    return conn
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
