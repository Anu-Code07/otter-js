# PixelPaw Integrations

## Webhook API

PixelPaw listens locally for attention signals:

```http
POST http://127.0.0.1:47832/attention
Content-Type: application/json

{
  "status": "needs_user",
  "priority": "high",
  "title": "My Tool",
  "message": "Something needs you",
  "source": "my-tool"
}
```

### Status values

| status | Meaning |
|--------|---------|
| `needs_user` | Triggers otter alert |
| `working` | Otter watches/thinks |
| `success` | Celebration animation |
| `error` | Annoyed reaction |
| `idle` | Clear signal |

### Health check

```http
GET http://127.0.0.1:47832/health
```

## curl example

```bash
curl -X POST http://127.0.0.1:47832/attention \
  -H 'Content-Type: application/json' \
  -d '{"status":"needs_user","message":"CI failed","title":"GitHub Actions"}'
```

## VS Code Extension

```bash
cd integrations/vscode-extension
# Package and install manually, or copy extension.js into a VS Code extension folder
```

Commands:
- **PixelPaw: Signal Needs Attention**
- **PixelPaw: Signal Task Complete**

## Build / Terminal log watching

Create log files for PixelPaw to watch:

```bash
mkdir -p ~/.pixelpaw
npm run build 2>&1 | tee ~/.pixelpaw/build.log
your-command 2>&1 | tee ~/.pixelpaw/terminal.log
```

Or set custom paths in **Settings → Attention Sources**.

## Git detection

Enable **Git** in Settings. PixelPaw checks for merge conflicts and dirty conflict states in the current project directory.

## Privacy

All integrations are **local only**. The webhook binds to `127.0.0.1` and never sends data off your machine.
