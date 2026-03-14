# Category C — Autonomous Agentic Workflows

LangGraph workflows served via FastAPI on Cloud Run.

## Structure:
```
category-c/
├── app/
│   ├── main.py              ← FastAPI app with health check, CORS
│   ├── config.py            ← Model routing, Supabase config
│   ├── workflows/
│   │   ├── research_task.py ← LangGraph graph
│   │   └── novel_marketing.py
│   └── tools/               ← Shared tool functions
│       ├── web_search.py
│       ├── db_client.py         ← Cloud SQL connection (was supabase_client.py)
│       └── whatsapp_sender.py
├── Dockerfile
├── requirements.txt
├── cloudbuild.yaml
└── README.md
```

## Deployment:
```bash
gcloud run deploy ai-os-agents \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --service-account ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \
  --add-cloudsql-instances bharatvarsh-website:us-central1:bharatvarsh-db \
  --set-secrets='ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest'
```

## Database Connection (Cloud SQL):
Cloud Run uses the Auth Proxy sidecar via `--add-cloudsql-instances`. The app connects via Unix socket:

**Connection pattern (in `app/tools/db_client.py`):**
```python
import pg8000
import os

def get_db_connection():
    """Connect to Cloud SQL via Auth Proxy Unix socket (Cloud Run)
    or via TCP for local development."""
    unix_socket = f"/cloudsql/bharatvarsh-website:us-central1:bharatvarsh-db/.s.PGSQL.5432"

    if os.path.exists(unix_socket):
        # Cloud Run — connect via Auth Proxy sidecar
        conn = pg8000.connect(
            user="ai_os_admin",
            password=os.environ["AI_OS_DB_PASSWORD"],
            database="ai_os",
            unix_sock=unix_socket,
        )
    else:
        # Local dev — connect via cloud-sql-proxy on localhost
        conn = pg8000.connect(
            host="127.0.0.1",
            port=5432,
            user="ai_os_admin",
            password=os.environ["AI_OS_DB_PASSWORD"],
            database="ai_os",
        )
    return conn
```

## Active Workflows:
- (none yet — Research Task is first candidate)
