import * as esbuild from 'esbuild';

const WIDGETS = ['github-prs'];

let failed = false;

for (const name of WIDGETS) {
  try {
    await esbuild.build({
      entryPoints: [`src/${name}/${name}.tsx`],
      outfile: `dist/${name}.jsx`,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      jsx: 'preserve',
      external: ['uebersicht'],
    });
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}:`, err.message);
    failed = true;
  }
}

if (failed) process.exit(1);
