import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { ClaudeAdapter } from '../adapters/claude.js';
import { CodexAdapter } from '../adapters/codex.js';
import { serializeSkillMd } from '../core/skill-parser.js';
import { error, header, info, success } from '../utils/display.js';

export async function exportCommand(id: string, options: { output?: string }) {
  const claudeAdapter = new ClaudeAdapter();
  const codexAdapter = new CodexAdapter();

  let skill: Awaited<ReturnType<ClaudeAdapter['read']>> | undefined;
  let sourceAgent = '';

  try {
    skill = await codexAdapter.read(id);
    sourceAgent = 'Codex App';
  } catch {
    try {
      skill = await claudeAdapter.read(id);
      sourceAgent = 'Claude Code';
    } catch {
      error('Automation "' + id + '" not found in any agent');
      process.exit(1);
    }
  }
  if (!skill) return;

  header('Exporting: ' + skill.meta.name);
  info('Source: ' + sourceAgent);
  info('Description: ' + skill.meta.description);
  if (skill.meta.schedule) info('Schedule: ' + skill.meta.schedule);
  console.log();

  const outDir = options.output || path.join(process.cwd(), skill.meta.name);
  mkdirSync(outDir, { recursive: true });

  const content = serializeSkillMd(skill.meta, skill.prompt);
  writeFileSync(path.join(outDir, 'SKILL.md'), content, 'utf-8');
  success('SKILL.md');

  for (const [filename, fileContent] of skill.auxiliaryFiles) {
    writeFileSync(path.join(outDir, filename), fileContent, 'utf-8');
    success(filename);
  }

  console.log();
  info('Exported to ' + outDir);
  info('Push to GitHub and share: npx agentcron add <your-username>/' + skill.meta.name);
}
