import inquirer from 'inquirer';
import chalk from 'chalk';
import type { AgentInfo } from '../core/detector.js';

export async function selectAgents(agents: AgentInfo[]): Promise<AgentInfo[]> {
  const { selected } = await inquirer.prompt<{ selected: Array<'claude' | 'codex'> }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select target agents',
      choices: agents.map((agent) => ({
        name:
          agent.name +
          (agent.version ? ' v' + agent.version : '') +
          (!agent.installed ? chalk.dim(' (not installed)') : ''),
        value: agent.id,
        checked: agent.installed,
        disabled: !agent.installed ? 'not installed' : false
      }))
    }
  ]);

  return agents.filter((agent) => selected.includes(agent.id));
}

export async function inputCwd(): Promise<string> {
  const { cwd } = await inquirer.prompt<{ cwd: string }>([
    {
      type: 'input',
      name: 'cwd',
      message: 'Working directory:',
      default: process.cwd()
    }
  ]);
  return cwd;
}

export async function confirm(message: string): Promise<boolean> {
  const { ok } = await inquirer.prompt<{ ok: boolean }>([
    {
      type: 'confirm',
      name: 'ok',
      message,
      default: true
    }
  ]);
  return ok;
}
