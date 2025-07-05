# Manual Test Commands

Use these curl commands to manually test your API and see LLM responses.

## 1. Health Check

```bash
curl http://localhost:4000/api/game/health
```

## 2. Start a Game

```bash
curl -X POST http://localhost:4000/api/game/start \
  -H "Content-Type: application/json" \
  -d '{"playerId": "test-player-123"}'
```

**Save the sessionId from the response!**

## 3. Test High Skill Player (Should increase difficulty)

```bash
curl -X POST http://localhost:4000/api/game/YOUR_SESSION_ID/update \
  -H "Content-Type: application/json" \
  -d '{
    "apm": 150,
    "dodgeRatio": 0.9,
    "round": 1,
    "distanceTraveled": 1500,
    "reactionTime": 0.15,
    "damageDealt": 200
  }'
```

## 4. Test Low Skill Player (Should decrease difficulty)

```bash
curl -X POST http://localhost:4000/api/game/YOUR_SESSION_ID/update \
  -H "Content-Type: application/json" \
  -d '{
    "apm": 40,
    "dodgeRatio": 0.25,
    "round": 2,
    "distanceTraveled": 400,
    "reactionTime": 0.6,
    "damageDealt": 50
  }'
```

## 5. Test Medium Skill Player (Should maintain difficulty)

```bash
curl -X POST http://localhost:4000/api/game/YOUR_SESSION_ID/update \
  -H "Content-Type: application/json" \
  -d '{
    "apm": 85,
    "dodgeRatio": 0.65,
    "round": 3,
    "distanceTraveled": 900,
    "reactionTime": 0.3,
    "damageDealt": 120
  }'
```

## 6. Get Current Config

```bash
curl http://localhost:4000/api/game/YOUR_SESSION_ID/config
```

## 7. Get Session Stats

```bash
curl http://localhost:4000/api/game/YOUR_SESSION_ID/stats
```

## 8. End Game

```bash
curl -X POST http://localhost:4000/api/game/YOUR_SESSION_ID/end
```

## What to Look For

### In the responses, check:

- `"llm_used": true` - Means LLM successfully generated new config
- `"llm_used": false` - Means fallback config was used (LLM failed)
- `"error"` field - Shows any LLM errors

### Expected LLM Behavior:

- **High skill player** → Terrain becomes "rugged", boss speed/damage increases
- **Low skill player** → Terrain becomes "smooth", boss speed/damage decreases
- **Medium skill player** → Moderate adjustments or terrain "sticky"

### Response Times:

- Should be 3-5 seconds when LLM is called
- <1 second when using fallback configs
