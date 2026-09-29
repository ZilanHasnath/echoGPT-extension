import { h } from '../../lib/dom.js';
import { LANGUAGES } from '../../lib/constants.js';
import { viewShell, field, selectOf, modelField, resultCard, streamTo, withBusy, toast } from '../../lib/components.js';
import { extractPage } from '../../lib/page.js';

export default function render(root, ctx, payload) {
  const body = viewShell(root, 'Translate');
  const source = h('textarea', { class: 'input boxed', rows: 6, placeholder: 'Enter or paste text to translate...' });
  const target = selectOf(LANGUAGES, 'English');
  const model = modelField(ctx);
  const card = resultCard();
  const run = h('button', { class: 'btn primary block' }, 'Translate');
  const useSelection = h('button', { class: 'btn' }, 'Use page selection');

  run.addEventListener('click', () => {
    if (!source.value.trim()) return toast('Enter some text first');
    return withBusy(run, () =>
      streamTo(card, {
        settings: ctx.settings,
        modelId: model.get(),
        system: `Translate the user's text into ${target.value}. Detect the source language automatically. Preserve meaning, tone and formatting. Return only the translation.`,
        messages: [{ role: 'user', text: source.value }]
      })
    );
  });

  useSelection.addEventListener('click', async () => {
    try {
      const page = await extractPage();
      if (!page.selection) return toast('Select some text on the page first');
      source.value = page.selection;
    } catch {
      toast('This page cannot be read');
    }
  });

  body.append(field('Text', source), useSelection, field('Translate to', target), model.el, run, card.el);
  if (payload?.text) {
    source.value = payload.text;
    run.click();
  }
}
