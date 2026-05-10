import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const BATCH_SIZE = 15;

function loadJson(file) {
  return JSON.parse(readFileSync(join(root, file), 'utf8'));
}

function saveJson(file, data) {
  writeFileSync(join(root, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function callClaude(prompt) {
  // Run from /tmp so the repo's CLAUDE.md / hooks don't interfere
  const result = execFileSync('claude', ['--print', prompt], {
    cwd: tmpdir(),
    timeout: 120_000,
    encoding: 'utf8',
  });
  return result.trim();
}

async function generateBatch(words, level) {
  const levelInstructions =
    level === 'elementary'
      ? 'Use simple, everyday vocabulary at A2-B1 level. Sentences should be 8–12 words long.'
      : 'Use more varied vocabulary at B2 level. Sentences should be 10–15 words long.';

  const wordList = words
    .map((w) => `${w.word} (${w.pos}, ${w.zh})`)
    .join('\n');

  const prompt =
    `You are a GEPT English teacher creating study materials. ` +
    `Generate one example sentence for each word below. ${levelInstructions} ` +
    `Also provide a Traditional Chinese (繁體中文) translation for each sentence. ` +
    `Return ONLY a valid JSON array, no markdown, no explanation: ` +
    `[{"word":"...","example":"...","example_zh":"..."}]\n\nWords:\n${wordList}`;

  const text = callClaude(prompt);
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`No JSON array found in response:\n${text.slice(0, 300)}`);
  return JSON.parse(jsonMatch[0]);
}

async function processFile(file, level) {
  const words = loadJson(file);
  const todo = words.filter((w) => !w.example);
  const total = words.length;

  console.log(`\n=== ${level} (${todo.length}/${total} words need examples) ===`);

  if (todo.length === 0) {
    console.log('All words already have examples. Skipping.');
    return;
  }

  let done = total - todo.length;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const results = await generateBatch(batch, level);
        const resultMap = new Map(results.map((r) => [r.word, r]));
        for (const word of words) {
          if (!word.example) {
            const r = resultMap.get(word.word);
            if (r) {
              word.example = r.example;
              word.example_zh = r.example_zh;
            }
          }
        }
        saveJson(file, words);
        done += batch.length;
        console.log(`  [${done}/${total}] ${level} — saved batch`);
        break;
      } catch (err) {
        attempts++;
        console.error(`  Batch error (attempt ${attempts}):`, err.message.slice(0, 120));
        if (attempts < 3) {
          const wait = attempts * 3000;
          console.log(`  Retrying in ${wait / 1000}s...`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          console.log('  Skipping batch after 3 failures.');
        }
      }
    }
  }

  console.log(`  Done: ${level}`);
}

async function main() {
  await processFile('src/data/elementary.json', 'elementary');
  await processFile('src/data/intermediate.json', 'intermediate');
  console.log('\nAll done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
