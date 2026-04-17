import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { homedir } from 'os';
import { fetchRecipeList, fetchRecipeFiles, type RecipeInfo } from '../core/github.js';
import { parseSkillMd } from '../core/skill-parser.js';

export async function addCommand() {
  const spinner = ora('Fetching recipe catalog...').start();
  let recipes: RecipeInfo[];
  try {
    recipes = await fetchRecipeList();
    spinner.stop();
  } catch (err: any) {
    spinner.fail('Failed to fetch recipes: ' + err.message);
    process.exit(1);
  }

  if (recipes.length === 0) {
    console.log('\n  No recipes available.\n');
    return;
  }

  console.log('\n  Available Recipes\n');

  const { selected } = await inquirer.prompt([{
    type: 'list',
    name: 'selected',
    message: 'Select a recipe to install',
    choices: recipes.map((r) => ({
      name: r.name + ' — ' + r.description + (r.schedule ? ' [' + r.schedule + ']' : ''),
      value: r.name,
    })),
  }]);

  const tasksDir = path.join(homedir(), '.claude', 'scheduled-tasks');
  const targetDir = path.join(tasksDir, selected);

  if (existsSync(targetDir)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: '"' + selected + '" already exists. Overwrite?',
      default: false,
    }]);
    if (!overwrite) return;
  }

  const dlSpinner = ora('Installing ' + selected + '...').start();
  try {
    const files = await fetchRecipeFiles(selected);
    mkdirSync(targetDir, { recursive: true });
    for (const [filename, content] of Object.entries(files)) {
      writeFileSync(path.join(targetDir, filename), content, 'utf-8');
    }
    dlSpinner.succeed('Installed to ~/.claude/scheduled-tasks/' + selected + '/');

    const skillContent = files['SKILL.md'];
    if (skillContent) {
      const { meta } = parseSkillMd(skillContent);
      if (meta.schedule) {
        console.log('\n  Schedule: ' + meta.schedule);
        console.log('  Configure in Claude Code Desktop → Scheduled Tasks\n');
      }
    }
  } catch (err: any) {
    dlSpinner.fail(err.message);
    process.exit(1);
  }
}
