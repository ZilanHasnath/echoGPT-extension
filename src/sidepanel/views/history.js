import { h, icon } from '../../lib/dom.js';
import { viewShell } from '../../lib/components.js';
import { listChats, deleteChat } from '../../lib/storage.js';
import { loadChat } from './chat.js';

export default async function render(root, ctx) {
  const body = viewShell(root, 'History',
    h('button', { class: 'icon-btn', title: 'Close', onclick: () => ctx.navigate('chat') }, icon('x', 20))
  );
  const chats = await listChats();
  if (!chats.length) body.append(h('p', { class: 'empty' }, 'No conversations yet. Start a chat and it will appear here.'));
  for (const chat of chats) {
    body.append(h('div', {
      class: 'row',
      onclick: () => {
        loadChat(chat);
        ctx.navigate('chat');
      }
    },
      h('div', { class: 'row-main' }, h('strong', {}, chat.title), h('small', {}, new Date(chat.updatedAt).toLocaleString())),
      h('button', {
        class: 'icon-btn small',
        title: 'Delete',
        onclick: async (event) => {
          event.stopPropagation();
          const row = event.currentTarget.closest('.row');
          await deleteChat(chat.id);
          row.remove();
        }
      }, icon('trash', 16))
    ));
  }
}
