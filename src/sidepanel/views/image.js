import { h, icon, clear } from '../../lib/dom.js';
import { IMAGE_SIZES } from '../../lib/constants.js';
import { viewShell, field, selectOf, withBusy, toast } from '../../lib/components.js';
import { generateImage } from '../../lib/providers.js';

const gallery = [];

export default function render(root, ctx) {
  const body = viewShell(root, 'Image');
  const prompt = h('textarea', { class: 'input boxed', rows: 4, placeholder: 'Describe the image you want to create...' });
  const size = selectOf(IMAGE_SIZES, '1024x1024');
  const run = h('button', { class: 'btn primary block' }, 'Generate image');
  const grid = h('div', { class: 'gallery' });

  function draw() {
    clear(grid);
    gallery.forEach((item) => {
      grid.append(h('figure', { class: 'shot' },
        h('img', { src: item.dataUrl, alt: item.prompt }),
        h('figcaption', {},
          h('span', {}, item.prompt),
          h('a', { class: 'icon-btn small', href: item.dataUrl, download: 'echogpt-image.png', title: 'Download' }, icon('download', 16))
        )
      ));
    });
  }

  run.addEventListener('click', () => {
    if (!prompt.value.trim()) return toast('Describe an image first');
    return withBusy(run, async () => {
      try {
        const dataUrl = await generateImage({ settings: ctx.settings, prompt: prompt.value.trim(), size: size.value });
        gallery.unshift({ dataUrl, prompt: prompt.value.trim() });
        draw();
      } catch (error) {
        toast(error.message);
      }
    });
  });

  body.append(field('Prompt', prompt), field('Size', size), run, grid);
  draw();
}
