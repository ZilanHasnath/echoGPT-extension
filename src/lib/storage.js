import { MODELS } from './constants.js';

const DEFAULTS = {
  name: 'You',
  theme: 'system',
  model: MODELS[0].id,
  keys: { openai: '', anthropic: '', google: '' },
  mcpServers: []
};

export async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  return { ...DEFAULTS, ...settings, keys: { ...DEFAULTS.keys, ...settings.keys } };
}

export const saveSettings = (settings) => chrome.storage.local.set({ settings });

export async function listChats() {
  const { chats = [] } = await chrome.storage.local.get('chats');
  return chats.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveChat(chat) {
  const chats = await listChats();
  const index = chats.findIndex((item) => item.id === chat.id);
  if (index >= 0) chats[index] = chat;
  else chats.push(chat);
  await chrome.storage.local.set({ chats: chats.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 100) });
}

export async function deleteChat(id) {
  const chats = await listChats();
  await chrome.storage.local.set({ chats: chats.filter((chat) => chat.id !== id) });
}
