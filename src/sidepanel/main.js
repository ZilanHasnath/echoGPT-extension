import { h, icon, clear } from '../lib/dom.js';
import { NAV, PROVIDERS } from '../lib/constants.js';
import { loadSettings, saveSettings } from '../lib/storage.js';
import { toast } from '../lib/components.js';
import chat from './views/chat.js';
import history from './views/history.js';
import write from './views/write.js';
import read from './views/read.js';
import translate from './views/translate.js';
import image from './views/image.js';
import video from './views/video.js';
import compare from './views/compare.js';
import mcp from './views/mcp.js';
import settings from './views/settings.js';

const views = { chat, history, write, read, translate, image, video, compare, mcp, settings };
const stage = h('main', { class: 'stage' });
const rail = h('nav', { class: 'rail' });
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

const ctx = {
  settings: null,
  view: 'chat',
  async update(patch) {
    ctx.settings = { ...ctx.settings, ...patch };
    await saveSettings(ctx.settings);
    applyTheme();
    renderRail();
  },
  navigate(view, payload) {
    ctx.view = view;
    renderRail();
    clear(stage);
    views[view](stage, ctx, payload);
  }
};

function applyTheme() {
  const dark = ctx.settings.theme === 'dark' || (ctx.settings.theme === 'system' && darkQuery.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

function railButton({ id, label, icon: name }) {
  const active = ctx.view === id || (id === 'chat' && ctx.view === 'history');
  return h('button', { class: `rail-item${active ? ' active' : ''}`, title: label, onclick: () => ctx.navigate(id) },
    icon(name, 20),
    h('span', {}, label)
  );
}

function renderRail() {
  clear(rail);
  const initial = (ctx.settings.name || 'You').trim().charAt(0).toUpperCase();
  rail.append(
    h('div', { class: 'rail-group' }, NAV.map(railButton)),
    h('div', { class: 'rail-group' },
      h('button', { class: 'rail-item', title: 'Upgrade', onclick: openUpgrade }, icon('upgrade', 20), h('span', {}, 'Upgrade')),
      railButton({ id: 'settings', label: 'Settings', icon: 'settings' }),
      h('button', { class: 'avatar', title: ctx.settings.name, onclick: () => ctx.navigate('settings') }, initial)
    )
  );
}

function openUpgrade() {
  const dialog = h('dialog', { class: 'dialog' },
    h('h2', {}, 'Bring your own keys'),
    h('p', {}, 'EchoGPT runs on your own API keys. You pay providers directly and your conversations stay in this browser. Add a key to unlock its models.'),
    h('div', { class: 'dialog-links' }, Object.values(PROVIDERS).map((provider) =>
      h('a', { class: 'btn', href: provider.keyUrl, target: '_blank', rel: 'noreferrer' }, `Get ${provider.label} key`)
    )),
    h('button', { class: 'btn primary', onclick: () => dialog.close() }, 'Done')
  );
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

async function consumePending() {
  const { pending } = await chrome.storage.session.get('pending');
  if (!pending) return;
  await chrome.storage.session.remove('pending');
  ctx.navigate(pending.view, { text: pending.text });
}

async function start() {
  ctx.settings = await loadSettings();
  applyTheme();
  darkQuery.addEventListener('change', applyTheme);
  document.getElementById('app').append(stage, rail);
  ctx.navigate('chat');
  consumePending();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes.pending?.newValue) consumePending();
  });
}

start().catch((error) => toast(error.message));
