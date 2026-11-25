// node --test tests/security/geocode-guard.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', '..');

function makeGuard({ perSession = '60', perServer = '600' } = {}) {
  class ConcurrentHashMap {
    constructor() { this.map = new Map(); }
    compute(key, update) { const value = update(key, this.map.has(key) ? this.map.get(key) : null); this.map.set(key, value); return value; }
  }
  let now = 1000;
  const symbols = { 'lib_Geocoding.maxRequestsPerMinutePerSession': perSession, 'lib_Geocoding.maxRequestsPerMinute': perServer };
  const sandbox = {
    java: {
      util: { concurrent: { ConcurrentHashMap } },
      lang: {
        System: { currentTimeMillis: () => now },
        IllegalArgumentException: class extends Error {}, SecurityException: class extends Error {},
      },
    },
    com: { twinsoft: { convertigo: { engine: { Engine: { theApp: { databaseObjectsManager: {
      getCompiledValue: (text) => symbols[text.match(/^\$\{([^=]+)=/)[1]],
    } } } } } } },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/geocodeGuard.js'), 'utf8'), sandbox);
  const holder = () => { const attributes = {}; return { getAttribute: (name) => attributes[name] ?? null, setAttribute: (name, value) => { attributes[name] = value; } }; };
  const server = holder();
  const session = () => ({ httpServletRequest: { getServletContext: () => server }, httpSession: holder() });
  return { guard: sandbox.geocodeGuard, session, tick: (ms) => { now += ms; } };
}

test('only coordinates within their ranges reach the geocoding service', () => {
  const { guard, session } = makeGuard();
  const context = session();
  assert.doesNotThrow(() => guard.check('48.722626299999995', '2.4224671', context));
  assert.doesNotThrow(() => guard.check(' -90 ', '+180', context));
  for (const [latitude, longitude] of [['91', '0'], ['0', '180.5'], ['', '1'], [null, '1'], ['1e2', '1'], ['48.7,2.4', '1'], ['1', 'NaN'], ['1', '1;x']]) {
    assert.throws(() => guard.check(latitude, longitude, context), /Invalid coordinates/, `${latitude} ${longitude}`);
  }
});

test('the calls are bounded per minute for a session and for the server', () => {
  const { guard, session, tick } = makeGuard({ perSession: '3', perServer: '5' });
  const first = session();
  for (let i = 0; i < 3; i++) guard.check('1', '1', first);
  assert.throws(() => guard.check('1', '1', first), /Too many geocoding requests/);
  // A new session does not escape the limit of the server.
  const second = session();
  guard.check('1', '1', second);
  assert.throws(() => guard.check('1', '1', session()), /Too many geocoding requests/);
  tick(60000);
  assert.doesNotThrow(() => guard.check('1', '1', first), 'a new minute starts a new window');
});

test('getGeocode checks its request first and caches its responses', () => {
  const yaml = fs.readFileSync(path.join(root, '_c8oProject/sequences/getGeocode.yaml'), 'utf8');
  assert.match(yaml, /\nresponseExpiryDate: absolute,86400\n↓Input_variables \[steps\.InputVariablesStep-\d+\]: \n↓CheckRequest \[steps\.SimpleStep-\d+\]: \n  expression: \|\n    include\("js\/geocodeGuard\.js"\);\n    geocodeGuard\.check\(latitude, longitude, context\);\n/);
});
