import { h, clear } from '../../lib/dom.js';
import { MODELS } from '../../lib/constants.js';
import { viewShell, field, resultCard, streamTo, withBusy, toast } from '../../lib/components.js';

export default function render(root, ctx) {
  const body = viewShell(root, 'Compare');
  const prompt = h('textarea', { class: 'input boxed', rows: 4, placeholder: 'Ask one question and see how each model answers...' });
  const picker = h('div', { class: 'chips wrap' });
  const results = h('div', { class: 'compare-grid' });
  const run = h('button', { class: 'btn primary block' }, 'Compare');
  const keyed = MODELS.filter((model) => ctx.settings.keys[model.provider]);
  const selected = new Set((keyed.length >= 2 ? keyed : MODELS).slice(0, 3).map((model) => model.id));

  function drawPicker() {
    clear(picker);
    MODELS.forEach((model) => {
      picker.append(h('button', {
        class: `pill${selected.has(model.id) ? ' on' : ''}`,
        onclick: () => {
          if (selected.has(model.id)) selected.delete(model.id);
          else selected.add(model.id);
          drawPicker();
        }
      }, model.label));
    });
  }

  run.addEventListener('click', () => {
    const text = prompt.value.trim();
    if (!text) return toast('Enter a prompt first');
    if (selected.size < 2) return toast('Pick at least two models');
    return withBusy(run, async () => {
      clear(results);
      await Promise.all([...selected].map((id) => {
        const card = resultCard();
        results.append(h('div', { class: 'compare-col' }, h('h3', {}, MODELS.find((model) => model.id === id).label), card.el));
        return streamTo(card, { settings: ctx.settings, modelId: id, messages: [{ role: 'user', text }] });
      }));
    });
  });

  body.append(field('Prompt', prompt), field('Models', picker), run, results);
  drawPicker();
}
