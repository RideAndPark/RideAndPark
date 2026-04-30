const test = require("node:test");
const assert = require("node:assert/strict");

const originalEnv = { ...process.env };
const originalLog = console.log;

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, originalEnv);
}

function loadServerWithAppMock(appMock) {
  const appPath = require.resolve("./app");
  const serverPath = require.resolve("./server");

  delete require.cache[appPath];
  delete require.cache[serverPath];

  require.cache[appPath] = {
    id: appPath,
    filename: appPath,
    loaded: true,
    exports: appMock
  };

  require("./server");
}

test.afterEach(() => {
  console.log = originalLog;
  restoreEnv();
});

test("server listens on the configured port and logs a startup message", () => {
  process.env.PORT = "4567";

  const listenCalls = [];
  const logMessages = [];
  console.log = (message) => {
    logMessages.push(message);
  };

  loadServerWithAppMock({
    listen(port, callback) {
      listenCalls.push(port);
      callback();
    }
  });

  assert.deepEqual(listenCalls, [4567]);
  assert.deepEqual(logMessages, ["RideAndPark backend listening on port 4567"]);
});

test("server falls back to port 3000 when PORT is not set", () => {
  delete process.env.PORT;

  const listenCalls = [];

  loadServerWithAppMock({
    listen(port) {
      listenCalls.push(port);
    }
  });

  assert.deepEqual(listenCalls, [3000]);
});
