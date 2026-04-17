# agentcron

Install shared Claude Code scheduled tasks.

## Usage

```bash
npx @1zero/agentcron list    # 내 스케줄 조회
npx @1zero/agentcron add     # 레시피 선택 → 설치
```

설치 위치: `~/.claude/scheduled-tasks/<name>/SKILL.md`
스케줄은 Claude Code Desktop → Scheduled Tasks에서 설정.

## Share your own

`recipes/<name>/SKILL.md` 추가 후 push.

```yaml
---
name: my-task
description: "What it does"
schedule: "0 9 * * 1-5"
---

프롬프트 내용...
```

## License

MIT
