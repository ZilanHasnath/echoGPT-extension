import { h, icon, clear } from '../../lib/dom.js';
import { viewShell, field, toast } from '../../lib/components.js';

export default function render(root, ctx) {
  const body = viewShell(root, 'MCP');
  const list = h('div', { class: 'list' });
  const name = h('input', { class: 'input boxed', placeholder: 'Server name' });
  const url = h('input', { class: 'input boxed', placeholder: 'https://example.com/mcp' });
  const token = h('input', { class: 'input boxed', type: 'password', placeholder: 'Access token (optional)' });
  const add = h('button', { class: 'btn primary block' }, icon('plus', 16), 'Add server');

  const servers = () => ctx.settings.mcpServers;

  function draw() {
    clear(list);
    if (!servers().length) list.append(h('p', { class: 'empty' }, 'No MCP servers yet. Add a remote server to give Claude models extra tools.'));
    servers().forEach((server) => {
      list.append(h('div', { class: 'row static' },
        h('div', { class: 'row-main' }, h('strong', {}, server.name), h('small', {}, server.url)),
        h('input', {
          class: 'switch',
          type: 'checkbox',
          title: 'Enabled',
          checked: server.enabled,
          onchange: (event) =>
            ctx.update({ mcpServers: servers().map((item) => (item.id === server.id ? { ...item, enabled: event.target.checked } : item)) })
        }),
        h('button', {
          class: 'icon-btn small',
          title: 'Remove',
          onclick: async () => {
            await ctx.update({ mcpServers: servers().filter((item) => item.id !== server.id) });
            draw();
          }
        }, icon('trash', 16))
      ));
    });
  }

  add.addEventListener('click', async () => {
    if (!name.value.trim() || !url.value.startsWith('https://')) return toast('Enter a name and an https:// URL');
    await ctx.update({
      mcpServers: [...servers(), { id: crypto.randomUUID(), name: name.value.trim(), url: url.value.trim(), token: token.value.trim(), enabled: true }]
    });
    name.value = url.value = token.value = '';
    draw();
  });

  body.append(
    h('p', { class: 'note' }, 'Enabled servers are attached to Claude models in Chat. Only remote HTTPS servers are supported.'),
    list,
    field('Name', name),
    field('URL', url),
    field('Token', token),
    add
  );
  draw();
}
