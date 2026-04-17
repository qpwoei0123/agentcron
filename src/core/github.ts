import { parseSkillMd } from './skill-parser.js';
const REPO = 'qpwoei0123/agentcron';
const BRANCH = 'main';
const RECIPES_DIR = 'recipes';
export interface RecipeInfo { name: string; description: string; schedule?: string; }
export async function fetchRecipeList(): Promise<RecipeInfo[]> {
  const apiUrl = 'https://api.github.com/repos/' + REPO + '/contents/' + RECIPES_DIR + '?ref=' + BRANCH;
  const res = await fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  const entries = await res.json() as { name: string; type: string }[];
  const dirs = entries.filter(e => e.type === 'dir');
  const recipes: RecipeInfo[] = [];
  for (const dir of dirs) {
    try {
      const skillUrl = 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/' + RECIPES_DIR + '/' + dir.name + '/SKILL.md';
      const skillRes = await fetch(skillUrl);
      if (!skillRes.ok) continue;
      const content = await skillRes.text();
      const { meta } = parseSkillMd(content);
      recipes.push({ name: meta.name || dir.name, description: meta.description || '', schedule: meta.schedule });
    } catch { /* skip broken recipes */ }
  }
  return recipes;
}
export async function fetchRecipeFiles(recipeName: string): Promise<Record<string, string>> {
  const apiUrl = 'https://api.github.com/repos/' + REPO + '/contents/' + RECIPES_DIR + '/' + recipeName + '?ref=' + BRANCH;
  const res = await fetch(apiUrl, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
  if (!res.ok) throw new Error('Recipe "' + recipeName + '" not found');
  const entries = await res.json() as { name: string; type: string; download_url: string }[];
  const files: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.type !== 'file') continue;
    const fileRes = await fetch(entry.download_url);
    if (fileRes.ok) files[entry.name] = await fileRes.text();
  }
  return files;
}
