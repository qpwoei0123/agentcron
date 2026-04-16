import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

export interface AgentInfo {
  name: string;
  id: 'claude' | 'codex';
  installed: boolean;
  version?: string;
  configPath: string;
}

export function detectAgents(): AgentInfo[] {
  const home = homedir();

  const agents: AgentInfo[] = [
    {
      name: 'Claude Code',
      id: 'claude',
      installed: existsSync(path.join(home, '.claude')),
      configPath: path.join(home, '.claude'),
      version: tryGetVersion('claude --version')
    },
    {
      name: 'Codex CLI',
      id: 'codex',
      installed: existsSync(path.join(home, '.codex')),
      configPath: path.join(home, '.codex'),
      version: tryGetVersion('codex --version')
    }
  ];

  return agents;
}

function tryGetVersion(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim().split('\n')[0];
  } catch {
    return undefined;
  }
}
