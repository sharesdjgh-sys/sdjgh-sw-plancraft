import assert from 'node:assert/strict';
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

test('campus saves, edits and deletes stay on the server while browser originals remain', async () => {
  const browser = new Map();
  const original = [{ id: crypto.randomUUID(), title: 'browser original' }];
  browser.set('plancraft_projects', JSON.stringify(original));
  const localStorage = {
    getItem: key => browser.get(key) ?? null,
    setItem: (key, value) => browser.set(key, value),
  };
  const writes = [];
  const deletes = [];
  const campusClient = {
    getCampusEpoch: () => 1,
    putCampusProject: async (project, revision) => {
      writes.push({ title: project.title, revision });
      return revision + 1;
    },
    deleteCampusProject: async (id, revision) => { deletes.push({ id, revision }); },
  };
  const source = fs.readFileSync(new URL('../src/lib/storage.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: testModule, exports: testModule.exports, require: name => {
      assert.equal(name, './campusClient');
      return campusClient;
    },
    localStorage, window: new EventTarget(), Event, crypto, Date,
  });
  const storage = testModule.exports;

  storage.activateServerProjects([]);
  const project = storage.createProject({ title: 'server draft', author: '', genre: '', targetCompetition: '', deadline: '', userType: 'student' });
  await storage.flushServerWrites();
  assert.deepEqual(writes, [{ title: 'server draft', revision: 0 }]);
  assert.equal(storage.getProjects().length, 1);
  assert.deepEqual(JSON.parse(browser.get('plancraft_projects')), original);

  storage.getProject(project.id).title = 'edited in place';
  storage.saveProjects(storage.getProjects());
  await storage.flushServerWrites();
  assert.deepEqual(writes[1], { title: 'edited in place', revision: 1 });

  storage.deleteProject(project.id);
  await storage.flushServerWrites();
  assert.deepEqual(deletes, [{ id: project.id, revision: 2 }]);
  assert.deepEqual(JSON.parse(browser.get('plancraft_projects')), original);
});
