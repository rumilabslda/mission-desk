// Launched by Claude Code / Claude Desktop as a stdio MCP server
// (the Mission Desk binary with ELECTRON_RUN_AS_NODE=1). It only relays bytes
// to the running Mission Desk; all permission checks happen in the app.
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

// Same default as bridgeDefaultSocket() in src/main/claude/server.ts.
const socketPath =
  process.env.MISSIONDESK_SOCKET || path.join(os.homedir(), 'Library', 'Application Support', 'Mission Desk', 'claude.sock'); // APP_NAME

const socket = net.createConnection(socketPath);
socket.on('connect', () => {
  if (process.env.MISSIONDESK_TOKEN) socket.write(`${process.env.MISSIONDESK_TOKEN}\n`); // private sockets (the in-app assistant)
  process.stdin.pipe(socket);
  socket.pipe(process.stdout);
});
socket.on('error', () => {
  process.stderr.write('Mission Desk is not running, or "Allow Claude to connect" is off (Mission Desk → Connect Claude…).\n');
  process.exit(1);
});
socket.on('close', () => process.exit(0));
process.stdin.on('end', () => socket.end());
