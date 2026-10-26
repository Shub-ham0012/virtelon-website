import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../public/tool-model.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source, context);
const tools = context.VirtelonTools;

test('WhatsApp model normalises a public number and encodes the message', () => {
  assert.equal(tools.whatsappUrl('+91', '09876 543 210', 'Hello Virtelon'), 'https://wa.me/919876543210?text=Hello%20Virtelon');
  assert.equal(tools.whatsappUrl('91', '123', 'Hello'), '');
});

test('missed-lead model exposes its transparent arithmetic', () => {
  const result = tools.leadScenario({ missed:15, value:2000, conversion:30, recovery:80 });
  assert.equal(Math.round(result.opportunity), 38970);
  assert.equal(Math.round(result.recovered), 31176);
  assert.equal(Math.round(result.annual), 374112);
});
