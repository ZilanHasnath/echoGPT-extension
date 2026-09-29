import { h, icon, clear } from './dom.js';
import { MODELS, PROVIDERS } from './constants.js';
import { streamChat } from './providers.js';
import { renderMarkdown } from './markdown.js';

export function toast(text) {
  const el = h('div', { class: 'toast' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

export function copyButton(getText) {
  return h('button', {
    class: 'icon-btn small',
    title: 'Copy',
    onclick: async () => {
      await navigator.clipboard.writeText(getText());
      toast('Copied');
    }
  }, icon('copy', 15));
}

export function viewShell(root, title, ...actions) {
  const body = h('div', { class: 'panel' });
  root.append(h('header', { class: 'head' }, h('h1', {}, title), h('div', { class: 'head-actions' }, actions)), body);
  return body;
}

export const field = (label, control) => h('label', { class: 'field' }, h('span', {}, label), control);

export const selectOf = (options, value) =>
  h('select', { class: 'select' }, options.map((option) => h('option', { value: option, selected: option === value }, option)));

export function modelSelect(value, onChange) {
  const select = h('select', { class: 'select', onchange: (event) => onChange(event.target.value) });
  for (const [id, provider] of Object.entries(PROVIDERS)) {
    const group = h('optgroup', { label: provider.label });
    for (const model of MODELS.filter((item) => item.provider === id)) {
      group.append(h('option', { value: model.id, selected: model.id === value }, model.label));
    }
    select.append(group);
  }
  return select;
}

export function modelField(ctx) {
  let value = ctx.settings.model;
  return { el: field('Model', modelSelect(value, (next) => (value = next))), get: () => value };
}

export async function withBusy(button, task) {
  button.disabled = true;
  button.classList.add('busy');
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.classList.remove('busy');
  }
}

export function openMenu(anchor, items) {
  document.querySelector('.menu')?.remove();
  const menu = h('div', { class: 'menu' }, items.map((item) =>
    h('button', {
      class: `menu-item${item.active ? ' active' : ''}`,
      onclick: () => {
        menu.remove();
        item.onClick();
      }
    }, item.label)
  ));
  document.body.append(menu);
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
  menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }));
}

export function messageEl(message) {
  const body = h('div', { class: 'msg-body' });
  if (message.role === 'assistant') {
    body.innerHTML = renderMarkdown(message.text);
    if (!message.text) body.classList.add('typing');
  } else {
    body.textContent = message.text;
  }
  return h('div', { class: `msg ${message.role}` },
    (message.images || []).map((src) => h('img', { class: 'msg-img', src })),
    body,
    message.role === 'assistant' && message.text ? h('div', { class: 'msg-actions' }, copyButton(() => message.text)) : null
  );
}

export function resultCard() {
  const out = h('div', { class: 'md' });
  const el = h('div', { class: 'result', hidden: true }, out, h('div', { class: 'msg-actions' }, copyButton(() => out.innerText)));
  return { el, out };
}

export async function streamTo(card, options) {
  card.el.hidden = false;
  card.out.classList.remove('error');
  card.out.classList.add('typing');
  card.out.textContent = '';
  let text = '';
  try {
    await streamChat({
      ...options,
      onToken: (token) => {
        text += token;
        card.out.classList.remove('typing');
        card.out.innerHTML = renderMarkdown(text);
      }
    });
  } catch (error) {
    card.out.classList.add('error');
    card.out.textContent = error.message;
  }
  card.out.classList.remove('typing');
  return text;
}

export { clear };
