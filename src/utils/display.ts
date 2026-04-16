import chalk from 'chalk';

export function header(text: string) {
  console.log('\n  ' + chalk.bold(text) + '\n');
}

export function success(text: string) {
  console.log('  ' + chalk.green('✓') + ' ' + text);
}

export function warn(text: string) {
  console.log('  ' + chalk.yellow('⚠') + ' ' + text);
}

export function error(text: string) {
  console.log('  ' + chalk.red('✗') + ' ' + text);
}

export function info(text: string) {
  console.log('  ' + text);
}

export function table(rows: [string, string][]) {
  const maxKey = Math.max(...rows.map(([key]) => key.length));
  for (const [key, value] of rows) {
    console.log('  ' + chalk.dim(key.padEnd(maxKey)) + '  ' + value);
  }
}
