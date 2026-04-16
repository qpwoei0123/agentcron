import chalk from 'chalk';
import { ClaudeAdapter } from '../adapters/claude.js';
import { CodexAdapter } from '../adapters/codex.js';
import { readLock } from '../lock/lockfile.js';
import { header, info } from '../utils/display.js';

export async function listCommand() {
  const claudeAdapter = new ClaudeAdapter();
  const codexAdapter = new CodexAdapter();

  const [claudeList, codexList] = await Promise.all([claudeAdapter.list(), codexAdapter.list()]);
  const all = [...claudeList, ...codexList];

  if (all.length === 0) {
    info('No automations found.');
    info('Install one: npx agentcron add <user/repo>');
    return;
  }

  const lock = readLock();

  header('Installed Automations');

  console.log(
    '  ' +
      chalk.dim('Name'.padEnd(30)) +
      '  ' +
      chalk.dim('Agent'.padEnd(12)) +
      '  ' +
      chalk.dim('Status'.padEnd(10)) +
      '  ' +
      chalk.dim('Source')
  );
  console.log('  ' + '─'.repeat(80));

  for (const item of all) {
    const statusText =
      item.status === 'ACTIVE'
        ? chalk.green('active')
        : item.status === 'PAUSED'
          ? chalk.yellow('paused')
          : chalk.dim('unknown');
    const source = String(lock.automations[item.name]?.source || chalk.dim('local'));
    const agentText = item.agent === 'claude' ? chalk.blue('Claude') : chalk.cyan('Codex');

    console.log(
      '  ' +
        item.name.padEnd(30) +
        '  ' +
        agentText +
        ' '.repeat(Math.max(0, 12 - item.agent.length)) +
        '  ' +
        statusText +
        ' '.repeat(10) +
        '  ' +
        source
    );
  }

  console.log('\n  ' + chalk.dim('Total: ' + all.length + ' automation(s)'));
}
