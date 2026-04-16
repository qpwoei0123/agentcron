import { ClaudeAdapter } from '../adapters/claude.js';
import { CodexAdapter } from '../adapters/codex.js';
import { getLockEntry, removeFromLock } from '../lock/lockfile.js';
import { confirm } from '../utils/prompt.js';
import { error, info, success, warn } from '../utils/display.js';

export async function removeCommand(name: string) {
  const lockEntry = getLockEntry(name);

  if (!lockEntry) {
    warn('"' + name + '" not in lock file, searching agents...');
  }

  const ok = await confirm('Remove "' + name + '" from all agents?');
  if (!ok) return;

  const claudeAdapter = new ClaudeAdapter();
  const codexAdapter = new CodexAdapter();

  let removed = 0;

  if (lockEntry?.targets?.claude || !lockEntry) {
    try {
      await claudeAdapter.remove(name);
      success('Removed from Claude Code');
      removed++;
    } catch {
      // 없으면 무시
    }
  }

  if (lockEntry?.targets?.codex || !lockEntry) {
    try {
      await codexAdapter.remove(name);
      success('Removed from Codex App');
      removed++;
    } catch {
      // 없으면 무시
    }
  }

  removeFromLock(name);

  if (removed > 0) {
    success('Lock file updated');
    info('Done! Removed "' + name + '" from ' + removed + ' agent(s)');
  } else {
    error('"' + name + '" not found in any agent');
  }
}
