#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { exportCommand } from './commands/export-cmd.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

const program = new Command();

program
  .name('agentcron')
  .description('Share AI agent automations across Claude Code and Codex App')
  .version('0.1.0');

program
  .command('add <repo>')
  .description('Install an automation from a GitHub repo (user/repo)')
  .option('--target <agents>', 'Comma-separated agent targets (claude,codex)')
  .option('--cwd <path>', 'Working directory for the automation')
  .action(addCommand);

program
  .command('export <id>')
  .description('Export an existing automation to SKILL.md format')
  .option('-o, --output <dir>', 'Output directory')
  .action(exportCommand);

program
  .command('list')
  .description('List all installed automations')
  .action(listCommand);

program
  .command('remove <name>')
  .description('Remove an installed automation')
  .action(removeCommand);

program.parse();
