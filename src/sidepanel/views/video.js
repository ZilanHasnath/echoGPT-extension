import { h, icon } from '../../lib/dom.js';
import { viewShell, modelField, resultCard, streamTo, withBusy, toast } from '../../lib/components.js';
import { extractVideo } from '../../lib/page.js';

const ACTIONS = [
  ['Summarize', 'Summarize this video in a short paragraph.'],
  ['Key moments', 'List the key moments and takeaways of this video as bullets.'],
  ['Study notes', 'Turn this video into concise study notes with headings.']
];

export default function render(root, ctx) {
  const info = h('div', { class: 'page-card' }, h('small', {}, 'Looking for a video on this tab...'));
  const refreshBtn = h('button', { class: 'icon-btn small', title: 'Refresh' }, icon('history', 16));
  const body = viewShell(root, 'Video');
  const model = modelField(ctx);
  const question = h('input', { class: 'input boxed', placeholder: 'Ask something about this video...' });
  const card = resultCard();
  let video = null;

  async function refresh() {
    try {
      video = await extractVideo();
      const detail = video.transcript ? 'Transcript found' : 'No transcript found. Open the transcript panel for better results.';
      info.replaceChildren(h('strong', {}, video.title), h('small', {}, video.hasVideo ? detail : 'No video detected on this page'));
    } catch {
      video = null;
      info.replaceChildren(h('small', {}, 'This page cannot be read. Open a video page and refresh.'));
    }
  }

  async function ask(prompt) {
    if (!prompt.trim()) return toast('Enter a question');
    await refresh();
    if (!video) return;
    await streamTo(card, {
      settings: ctx.settings,
      modelId: model.get(),
      system: 'You analyze videos from their metadata and transcript. If no transcript is provided, say so and rely on the title and description.',
      messages: [{
        role: 'user',
        text: `Title: ${video.title}\nChannel: ${video.channel}\nURL: ${video.url}\nDescription: ${video.description}\n\nTranscript:\n${video.transcript || 'Not available'}\n\n---\n${prompt}`
      }]
    });
  }

  const askBtn = h('button', { class: 'btn primary' }, 'Ask');
  askBtn.addEventListener('click', () => withBusy(askBtn, () => ask(question.value)));
  question.addEventListener('keydown', (event) => event.key === 'Enter' && askBtn.click());
  refreshBtn.addEventListener('click', refresh);

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
