import matter from 'gray-matter';

export interface SkillMeta {
  name: string;
  description: string;
  schedule?: string;
  model?: string;
  reasoning_effort?: string;
  source_agent?: 'claude' | 'codex';
  [key: string]: unknown;
}

export interface Skill {
  meta: SkillMeta;
  prompt: string;
  auxiliaryFiles: Map<string, string>;
}

export function parseSkillMd(content: string): { meta: SkillMeta; prompt: string } {
  const { data, content: body } = matter(content);
  return { meta: data as SkillMeta, prompt: body.trim() };
}

export function serializeSkillMd(meta: SkillMeta, prompt: string): string {
  return matter.stringify(prompt, meta);
}
