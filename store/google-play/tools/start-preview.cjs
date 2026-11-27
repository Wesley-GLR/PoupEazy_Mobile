/* Run manually when capturing the real app against the local synthetic API. */
// Prerequisites: demo-api.cjs listening on loopback 43188, and adb reverse
// tcp:43188 tcp:43188 plus tcp:8081 tcp:8081 for the target Android emulator.
// If Windows binds Metro only on ::1, use the local loopback-relay.cjs too.
'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const child = spawn(process.execPath, [
  path.join(root, 'node_modules/expo/bin/cli'),
  'start', '--localhost', '--go', '--port', '8081',
], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_API_URL: 'http://127.0.0.1:43188/api',
    EXPO_OFFLINE: '1',
    CI: '1',
    REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1',
  },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
