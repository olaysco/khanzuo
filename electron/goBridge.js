const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');
const readline = require('readline');
const crypto = require('crypto');

class GoBridge extends EventEmitter {
  constructor() {
    super();
    const { command, args } = resolveCommand();
    this.child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.pending = new Map();

    this.child.stderr.on('data', (chunk) => {
      console.error(`[agent] ${chunk}`);
    });
    this.child.on('exit', (code) => {
      console.warn(`Go agent exited with code ${code}`);
    });

    const rl = readline.createInterface({ input: this.child.stdout });
    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line);
        this.handleMessage(msg);
      } catch (err) {
        console.error('Failed to parse agent message', err, line);
      }
    });
  }

  handleMessage(msg) {
    if ((msg.kind === 'response' || msg.kind === 'browserResult') && msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) {
        reject(new Error(msg.error.message || 'agent error'));
      } else {
        resolve(msg.payload ?? null);
      }
      return;
    }

    if (msg.kind === 'event') {
      this.emit('event', msg);
      return;
    }

    if (msg.kind === 'browserCommand') {
      this.emit('browser-command', msg);
      return;
    }

    console.warn('Unhandled agent message', msg);
  }

  sendRaw(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(command, payload = {}) {
    const id = crypto.randomUUID();
    const message = { kind: 'request', id, command, payload };
    this.sendRaw(message);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  sendBrowserResult(id, payload = null, error = null) {
    const message = { kind: 'browserResult', id };
    if (payload) message.payload = payload;
    if (error) message.error = { message: error.message || String(error) };
    this.sendRaw(message);
  }
}

function resolveCommand() {
  const cwd = process.cwd();
  const explicit = process.env.KHANZUO_AGENT_CMD;
  if (explicit) {
    const [cmd, ...rest] = explicit.split(' ');
    return { command: cmd, args: rest };
  }

  const binaryPath = join(cwd, 'khanzuo-agent');
  if (existsSync(binaryPath)) {
    return { command: binaryPath, args: [] };
  }

  return { command: 'go', args: ['run', './cmd/agent'] };
}

module.exports = GoBridge;
