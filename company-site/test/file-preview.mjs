// Offline visual-only artifact when a local HTTP listener is unavailable.
// This is not a deployment and cannot validate HTTP/API behavior.
import { cp, readFile, writeFile, readdir } from 'node:fs/promises';
const source = new URL('../dist/', import.meta.url);
const target = new URL('../qa/file-preview/', import.meta.url);
await cp(source, target, { recursive: true });
for (const name of await readdir(target)) {
  if (!/\.(html|js)$/.test(name)) continue;
  let text = await readFile(new URL(name, target), 'utf8');
  text = text.replace(/((?:href|src)=")\/([^"?#]*)([^" ]*)"/g, (_, attr, path, rest) => {
    if (path.startsWith('api/')) return `${attr}/${path}${rest}"`;
    return `${attr}./${!path ? 'index.html' : path.includes('.') ? path : `${path}.html`}${rest}"`;
  }).replaceAll("'/assets/", "'./assets/");
  await writeFile(new URL(name, target), text);
}
console.log(new URL('index.html', target).href);
