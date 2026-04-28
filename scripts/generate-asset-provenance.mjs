import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const assetDirs = [
  join(process.cwd(), 'assets', 'brand'),
  join(process.cwd(), 'assets', 'optimized'),
];

async function gather() {
  const records = [];
  for (const dir of assetDirs) {
    try {
      const files = await readdir(dir);
      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!['.png', '.svg', '.jpg', '.jpeg'].includes(ext)) continue;
        const path = join(dir, file);
        const data = await readFile(path);
        const size = data.length;
        records.push({
          path: path.replace(process.cwd() + '/', ''),
          size,
          source: 'Palette', // placeholder, to be filled by art lead
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      // ignore missing dirs
    }
  }
  await writeFile('assets/provenance.json', JSON.stringify(records, null, 2));
}

gather().catch(console.error);
