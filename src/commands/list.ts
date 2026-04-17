import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { homedir } from 'os';
import { parseSkillMd } from '../core/skill-parser.js';

export async function listCommand() {
  const tasksDir = path.join(homedir(), '.claude', 'scheduled-tasks');
  if (!existsSync(tasksDir)) {
    console.log('\n  No scheduled tasks found.');
    console.log('  Run ' + 'agentcron add' + ' to install one.\n');
    return;
  }
  const entries = readdirSync(tasksDir, { withFileTypes: true });
  const tasks: { name: string; description: string }[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(tasksDir, entry.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;
    const raw = readFileSync(skillPath, 'utf-8');
    const { meta } = parseSkillMd(raw);
    tasks.push({ name: meta.name || entry.name, description: meta.description || '' });
  }
  if (tasks.length === 0) {
    console.log('\n  No scheduled tasks found.');
    console.log('  Run agentcron add to install one.\n');
    return;
  }
  console.log('\n  Claude Code Scheduled Tasks\n');
  for (const task of tasks) {
    console.log('  ● ' + task.name);
    console.log('    ' + task.description);
  }
  console.log('\n  Total: ' + tasks.length + '\n');
}
