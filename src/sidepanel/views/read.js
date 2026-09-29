import { h, icon } from '../../lib/dom.js';
import { viewShell, modelField, resultCard, streamTo, withBusy, toast } from '../../lib/components.js';
import { extractPage } from '../../lib/page.js';

const ACTIONS = [
  ['Summarize', 'Summarize this page in a short paragraph.'],
  ['Key points', 'List the key points of this page as bullets.'],
  ['Explain simply', 'Explain this page in simple terms.']
];

export default function render(root, ctx) {
  const info = h('div', { class: 'page-card' });
  const refreshBtn = h('button', { class: 'icon-btn small', title: 'Refresh' }, icon('history', 16));
  const body = viewShell(root, 'Read page');
  const model = modelField(ctx);
  const question = h('input', { class: 'input boxed', placeholder: 'Ask something about this page...' });
  const card = resultCard();
  let page = null;

  async function refresh() {
    try {
      page = await extractPage();
      info.replaceChildren(h('strong', {}, page.title || 'Untitled'), h('small', {}, page.url));
    } catch {
      page = null;
      info.replaceChildren(h('small', {}, 'This page cannot be read. Open a regular web page and refresh.'));
    }
  }

  async function ask(prompt) {
    if (!prompt.trim()) return toast('Enter a question');
    await refresh();
    if (!page) return;
    const focus = page.selection ? `\n\nSelected text:\n${page.selection}` : '';
    await streamTo(card, {
      settings: ctx.settings,
      modelId: model.get(),
      system: 'Answer using only the provided web page. Be concise and well structured.',
      messages: [{ role: 'user', text: `Title: ${page.title}\nURL: ${page.url}\n\n${page.text}${focus}\n\n---\n${prompt}` }]
    });
  }

  const askBtn = h('button', { class: 'btn primary' }, 'Ask');
  askBtn.addEventListener('click', () => withBusy(askBtn, () => ask(question.value)));
  question.addEventListener('keydown', (event) => event.key === 'Enter' && askBtn.click());
  refreshBtn.addEventListener('click', refresh);
  info.append(h('small', {}, 'Reading the current tab...'));

  body.append(
    h('div', { class: 'page-row' }, info, refreshBtn),
    h('div', { class: 'chips wrap' }, ACTIONS.map(([label, prompt]) => {
      const button = h('button', { class: 'pill' }, label);
      button.addEventListener('click', () => withBusy(button, () => ask(prompt)));
      return button;
    })),
    h('div', { class: 'inline-row' }, question, askBtn),
    model.el,
    card.el
  );
  refresh();
}
