import { createWriteStream, mkdirSync, readdirSync } from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import * as tar from 'tar';

export interface FetchResult {
  skillMdPath: string;
  directory: string;
  files: string[];
}

export async function fetchFromGitHub(repoSlug: string): Promise<FetchResult> {
  const [repo, branch = 'main'] = repoSlug.split('#');
  const tarballUrl = 'https://github.com/' + repo + '/archive/refs/heads/' + branch + '.tar.gz';

  const tmpDir = path.join(os.tmpdir(), 'agentcron-' + Date.now());
  mkdirSync(tmpDir, { recursive: true });

  const response = await fetch(tarballUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch ' + repo + ': ' + response.status + ' ' + response.statusText);
  }
  if (!response.body) {
    throw new Error('Failed to fetch ' + repo + ': empty response body');
  }

  const tarPath = path.join(tmpDir, 'repo.tar.gz');
  const fileStream = createWriteStream(tarPath);
  await pipeline(Readable.fromWeb(response.body as any), fileStream);

  const extractDir = path.join(tmpDir, 'extracted');
  mkdirSync(extractDir, { recursive: true });
  await tar.x({ file: tarPath, cwd: extractDir, strip: 1 });

  const files = listFilesRecursive(extractDir);
  const skillMdPath = files.find((file) => path.basename(file) === 'SKILL.md');

  if (!skillMdPath) {
    throw new Error('No SKILL.md found in ' + repo);
  }

  return {
    skillMdPath,
    directory: path.dirname(skillMdPath),
    files: files.map((file) => path.relative(extractDir, file))
  };
}

function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      results.push(...listFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}
