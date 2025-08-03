const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('ws');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', ws => {
  const shell = pty.spawn(process.env.SHELL || 'bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  shell.onData(data => ws.send(data));
  shell.onExit(() => ws.close());

  ws.on('message', msg => {
    const data = msg.toString();
    try {
      const { type, cols, rows } = JSON.parse(data);
      if (type === 'resize') {
        shell.resize(cols, rows);
        return;
      }
    } catch {
      // not a JSON message, treat as shell input
    }
    shell.write(data);
  });

  ws.on('close', () => shell.kill());
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
