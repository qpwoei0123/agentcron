import type { Skill } from '../core/skill-parser.js';

export interface InstalledAutomation {
  name: string;
  agent: 'claude' | 'codex';
  schedule?: string;
  status?: string;
  path: string;
}

export interface AgentAdapter {
  readonly agentId: 'claude' | 'codex';
  readonly agentName: string;

  write(skill: Skill, options: WriteOptions): Promise<string>;
  read(id: string): Promise<Skill>;
  list(): Promise<InstalledAutomation[]>;
  remove(id: string): Promise<void>;
}

export interface WriteOptions {
  cwds?: string[];
  status?: 'ACTIVE' | 'PAUSED';
}
