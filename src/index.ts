#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
const program = new Command();
program.name('agentcron').description('Install shared Claude Code scheduled tasks').version('0.2.0');
program.command('list').description('List installed Claude Code scheduled tasks').action(listCommand);
program.command('add').description('Browse and install a scheduled task from the recipe catalog').action(addCommand);
program.parse();
