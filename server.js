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

  ws.on('message', msg => shell.write(msg));
  ws.on('close', () => shell.kill());
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
