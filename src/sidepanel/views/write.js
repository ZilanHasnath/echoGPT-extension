import { h } from '../../lib/dom.js';
import { TONES, FORMATS, LENGTHS } from '../../lib/constants.js';
import { viewShell, field, selectOf, modelField, resultCard, streamTo, withBusy, toast } from '../../lib/components.js';

export default function render(root, ctx, payload) {
  const body = viewShell(root, 'Write');
  const brief = h('textarea', {
    class: 'input boxed',
    rows: 5,
    placeholder: 'What should I write? Add key points, audience, or paste a draft to improve.'
  });
  if (payload?.text) brief.value = payload.text;
  const tone = selectOf(TONES, 'Professional');
  const format = selectOf(FORMATS, 'Email');
  const length = selectOf(LENGTHS, 'Medium');
  const model = modelField(ctx);
  const card = resultCard();
  const run = h('button', { class: 'btn primary block' }, 'Generate');

  run.addEventListener('click', () => {
    if (!brief.value.trim()) return toast('Enter a brief first');
    return withBusy(run, () =>
      streamTo(card, {
        settings: ctx.settings,
        modelId: model.get(),
        system: `You are an expert writer. Write a ${length.value.toLowerCase()} ${format.value.toLowerCase()} in a ${tone.value.toLowerCase()} tone. Return only the finished text.`,
        messages: [{ role: 'user', text: brief.value }]
      })
    );
  });

  body.append(
    field('Brief', brief),
    h('div', { class: 'grid-3' }, field('Tone', tone), field('Format', format), field('Length', length)),
    model.el,
    run,
    card.el
  );
}
