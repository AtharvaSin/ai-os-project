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
│       ├── supabase_client.py
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
  --set-secrets='ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest'
```

## Active Workflows:
- (none yet — Research Task is first candidate)
