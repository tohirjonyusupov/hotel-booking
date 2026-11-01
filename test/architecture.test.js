// The three borders between the modules. Run them with the other tests:  node --test
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// Every import in one module's code, as { file, module, internal }: the module the import
// points into ("rooms", "reservations" ...) and whether it reaches that module's internal/ folder.
function importsOf(module) {
  const folder = path.join('src', module);
  return fs.readdirSync(folder, { recursive: true })
    .filter(name => name.endsWith('.js'))
    .flatMap(name => {
      const file = path.join(folder, name);
      const text = fs.readFileSync(file, 'utf8');
      return [...text.matchAll(/from\s+'([^']+)'/g)].map(([, specifier]) => {
        const [target, next] = path.relative('src', path.resolve(path.dirname(file), specifier)).split(path.sep);
        // The file is shown with / on every system, so the message is the same on Windows.
        return { file: file.split(path.sep).join('/'), specifier, module: target, internal: next === 'internal' };
      });
    });
}

test('Reservations uses only the public contracts of other modules', () => {
  for (const use of importsOf('reservations')) {
    assert.ok(use.module === 'reservations' || !use.internal, `${use.file} imports ${use.specifier}`);
  }
});

test('Rooms does not depend on any other module', () => {
  for (const use of importsOf('rooms')) {
    assert.ok(!['reservations', 'payments', 'notifications'].includes(use.module), `${use.file} imports ${use.specifier}`);
  }
});

test('Payments and Notifications do not depend on Reservations', () => {
  for (const use of [...importsOf('payments'), ...importsOf('notifications')]) {
    assert.notEqual(use.module, 'reservations', `${use.file} imports ${use.specifier}`);
  }
});
