import { describe, expect, it } from 'vitest';
import { parseSkillMd, serializeSkillMd } from '../src/core/skill-parser.js';

describe('parseSkillMd', () => {
  it('parses frontmatter and body', () => {
    const content =
      '---\nname: test-automation\ndescription: "Test automation"\nschedule: "0 9 * * 1-5"\n---\n\nThis is the prompt body.';

    const { meta, prompt } = parseSkillMd(content);
    expect(meta.name).toBe('test-automation');
    expect(meta.description).toBe('Test automation');
    expect(meta.schedule).toBe('0 9 * * 1-5');
    expect(prompt).toBe('This is the prompt body.');
  });

  it('handles optional fields', () => {
    const content = '---\nname: simple\ndescription: "Simple task"\n---\n\nDo something.';

    const { meta } = parseSkillMd(content);
    expect(meta.schedule).toBeUndefined();
    expect(meta.model).toBeUndefined();
  });
});

describe('serializeSkillMd', () => {
  it('round-trips correctly', () => {
    const meta = { name: 'test', description: 'Test task', schedule: '0 9 * * *' };
    const prompt = 'Do the thing.';

    const serialized = serializeSkillMd(meta, prompt);
    const parsed = parseSkillMd(serialized);

    expect(parsed.meta.name).toBe('test');
    expect(parsed.prompt).toContain('Do the thing.');
  });
});
