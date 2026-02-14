import assert from 'node:assert';
import { execSync } from 'node:child_process';

console.log('Testing sec-insider-cli...\n');

// Test 1: Help output
const help = execSync('node index.js --help', { encoding: 'utf8' });
assert(help.includes('sec-insider') || help.includes('SEC'), 'Help should show tool name');
console.log('✅ Test 1: Help output works');

// Test 2: Mentions ticker option
assert(help.includes('ticker') || help.includes('-t'), 'Should have ticker option');
console.log('✅ Test 2: Options documented');

console.log('\n✅ All tests passed!');
