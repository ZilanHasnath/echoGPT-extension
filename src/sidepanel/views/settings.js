import { h } from '../../lib/dom.js';
import { PROVIDERS } from '../../lib/constants.js';
import { viewShell, field, modelSelect } from '../../lib/components.js';

export default function render(root, ctx) {
  const body = viewShell(root, 'Settings');
  const current = ctx.settings;

  const name = h('input', {
    class: 'input boxed',
    value: current.name,
    onchange: (event) => ctx.update({ name: event.target.value.trim() || 'You' })
  });

  const theme = h('select', { class: 'select', onchange: (event) => ctx.update({ theme: event.target.value }) },
    ['system', 'light', 'dark'].map((value) => h('option', { value, selected: value === current.theme }, value[0].toUpperCase() + value.slice(1)))
  );

  const keys = Object.entries(PROVIDERS).map(([id, provider]) =>
    field(`${provider.label} API key`, h('div', { class: 'inline-row' },
      h('input', {
        class: 'input boxed',
        type: 'password',
        value: current.keys[id],
        placeholder: 'Paste key',
        autocomplete: 'off',
        onchange: (event) => ctx.update({ keys: { ...ctx.settings.keys, [id]: event.target.value.trim() } })
      }),
      h('a', { class: 'btn', href: provider.keyUrl, target: '_blank', rel: 'noreferrer' }, 'Get key')
    ))
  );

  const wipe = h('button', {
    class: 'btn danger block',
    onclick: async () => {
      if (!confirm('Delete all chats, keys and settings?')) return;
      await chrome.storage.local.clear();
      location.reload();
    }
  }, 'Delete all data');

  body.append(
    field('Your name', name),
    field('Theme', theme),
    field('Default model', modelSelect(current.model, (model) => ctx.update({ model }))),
    ...keys,
    h('p', { class: 'note' }, 'Keys are stored only in this browser and sent directly to each provider.'),
    wipe
  );
}
