import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';

interface LockEntry {
  source: string;
  installed_at: string;
  targets: Record<string, string>;
  version?: string;
}

interface LockData {
  version: number;
  automations: Record<string, LockEntry>;
}

const LOCK_DIR = path.join(homedir(), '.agentcron');
const LOCK_FILE = path.join(LOCK_DIR, 'lock.json');

export function readLock(): LockData {
  if (!existsSync(LOCK_FILE)) {
    return { version: 1, automations: {} };
  }
  return JSON.parse(readFileSync(LOCK_FILE, 'utf-8')) as LockData;
}

export function writeLock(data: LockData): void {
  mkdirSync(LOCK_DIR, { recursive: true });
  writeFileSync(LOCK_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function addToLock(name: string, entry: LockEntry): void {
  const lock = readLock();
  lock.automations[name] = entry;
  writeLock(lock);
}

export function removeFromLock(name: string): void {
  const lock = readLock();
  delete lock.automations[name];
  writeLock(lock);
}

export function getLockEntry(name: string): LockEntry | undefined {
  return readLock().automations[name];
}
