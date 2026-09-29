import { h, icon, clear } from '../../lib/dom.js';
import { QUICK_ACTIONS, SUGGESTIONS, PERSONAS, MODELS } from '../../lib/constants.js';
import { modelSelect, messageEl, toast, openMenu } from '../../lib/components.js';
import { streamChat, completeText } from '../../lib/providers.js';
import { renderMarkdown } from '../../lib/markdown.js';
import { webSearch } from '../../lib/search.js';
import { extractPage, captureTab } from '../../lib/page.js';
import { saveChat } from '../../lib/storage.js';

const blankSession = () => ({
  id: crypto.randomUUID(),
  title: '',
  model: null,
  messages: [],
  persona: PERSONAS[0],
  search: false,
  attachments: [],
  controller: null
});

const session = blankSession();
let view = null;

export function loadChat(chat) {
  Object.assign(session, blankSession(), {
    id: chat.id,
    title: chat.title,
    model: chat.model,
    messages: chat.messages,
    persona: PERSONAS.find((persona) => persona.id === chat.personaId) || PERSONAS[0]
  });
}

const toApi = (message) => ({
  role: message.role,
  text: message.context ? `${message.context}\n\n${message.text}` : message.text,
  images: message.images
});

const serialize = () => ({
  id: session.id,
  title: session.title,
  model: session.model,
  personaId: session.persona.id,
  messages: session.messages.map(({ role, text, context, images }) => ({ role, text, context, images })),
  updatedAt: Date.now()
});

const readDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

async function searchContext(query) {
  try {
    const results = await webSearch(query);
    if (!results.length) return '\n\nWeb search returned no results.';
    const lines = results.map((item, index) => `${index + 1}. ${item.text} (${item.url})`).join('\n');
    return `\n\nWeb search results:\n${lines}\nUse them when relevant and mention the source URLs.`;
  } catch {
    return '';
  }
}

export default function render(root, ctx, payload) {
  if (!session.model) session.model = ctx.settings.model;

  const thread = h('div', { class: 'thread' });
  const chips = h('div', { class: 'chips', hidden: true });
  const input = h('textarea', { class: 'input', rows: 1, placeholder: 'Ask a question...' });
  const sendBtn = h('button', { class: 'send', title: 'Send' });
  const personaBtn = h('button', { class: 'tool', title: 'Persona' }, icon('userplus', 18));
  const searchBtn = h('button', { class: `toggle${session.search ? ' on' : ''}` }, icon('globe', 14), 'Search');
  const fileInput = h('input', {
    type: 'file',
    multiple: true,
    hidden: true,
    accept: 'image/*,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css'
  });

  function autosize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }

  function drawChips() {
    clear(chips);
    session.attachments.forEach((item, index) => {
      chips.append(h('span', { class: 'chip' },
        item.kind === 'image' ? h('img', { src: item.dataUrl }) : icon('read', 14),
        h('em', {}, item.name),
        h('button', {
          title: 'Remove',
          onclick: () => {
            session.attachments.splice(index, 1);
            drawChips();
          }
        }, icon('x', 12))
      ));
    });
    chips.hidden = !session.attachments.length;
  }

  function addAttachment(item) {
    session.attachments.push(item);
    drawChips();
  }

  function drawThread() {
    clear(thread);
    if (!session.messages.length) {
      thread.append(h('div', { class: 'welcome' },
        h('div', { class: 'hero' }, h('h2', {}, "What's the vibe today?"), h('p', {}, 'Pick a tool or just ask anything.')),
        h('div', { class: 'quick-grid' }, QUICK_ACTIONS.map((action) =>
          h('button', { class: `quick tone-${action.tone}`, onclick: () => ctx.navigate(action.view) },
            h('span', { class: 'quick-icon' }, icon(action.icon, 16)),
            h('span', { class: 'quick-label' }, action.label)
          )
        )),
        h('div', { class: 'suggestions' }, SUGGESTIONS.map((text) =>
          h('button', { class: 'suggestion', onclick: () => submit(text) }, text)
        ))
      ));
      return;
    }
    session.messages.forEach((message) => thread.append(messageEl(message)));
    thread.scrollTop = thread.scrollHeight;
  }

  function setSending(active) {
    sendBtn.replaceChildren(icon(active ? 'stop' : 'send', 18));
    sendBtn.classList.toggle('stop', active);
  }

  function stream(text) {
    const body = thread.lastElementChild?.querySelector('.msg-body');
    if (!body) return;
    body.classList.remove('typing');
    body.innerHTML = renderMarkdown(text);
    thread.scrollTop = thread.scrollHeight;
  }

  async function submit(raw) {
    const text = raw.trim();
    if (session.controller || (!text && !session.attachments.length)) return;
    const mention = text.match(/^@([\w.-]+)\s+/);
    const mentioned = mention && MODELS.find((model) => model.id === mention[1]);
    const prompt = mentioned ? text.slice(mention[0].length) : text;
    const modelId = mentioned ? mentioned.id : session.model;
    const context = session.attachments
      .filter((item) => item.kind === 'text')
      .map((item) => `[${item.name}]\n${item.text}`)
      .join('\n\n');
    const images = session.attachments.filter((item) => item.kind === 'image').map((item) => item.dataUrl);
    const reply = { role: 'assistant', text: '' };
    session.messages.push({ role: 'user', text: prompt, context, images }, reply);
    session.title = session.title || prompt.slice(0, 60) || 'New chat';
    session.attachments = [];
    input.value = '';
    autosize();
    drawChips();
    session.controller = new AbortController();
    view.setSending(true);
    view.drawThread();
    let system = session.persona.prompt;
    try {
      if (session.search) system += await searchContext(prompt);
      await streamChat({
        settings: ctx.settings,
        modelId,
        system: system.trim(),
        mcp: true,
        signal: session.controller.signal,
        messages: session.messages.slice(0, -1).map(toApi),
        onToken: (token) => {
          reply.text += token;
          view.stream(reply.text);
        }
      });
    } catch (error) {
      if (error.name !== 'AbortError') toast(error.message);
    }
    session.controller = null;
    if (session.messages.at(-1) === reply && !reply.text) session.messages.pop();
    view.setSending(false);
    view.drawThread();
    await saveChat(serialize());
  }

  async function enhance(button) {
    const text = input.value.trim();
    if (!text) return toast('Type a prompt first');
    button.disabled = true;
    try {
      const improved = await completeText({
        settings: ctx.settings,
        modelId: session.model,
        system: 'Rewrite the user prompt to be clearer, more specific and better structured. Return only the improved prompt.',
        messages: [{ role: 'user', text }]
      });
      input.value = improved.trim();
      autosize();
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  }

  function newChat() {
    session.controller?.abort();
    Object.assign(session, blankSession(), { model: ctx.settings.model });
    drawThread();
    drawChips();
    setSending(false);
    searchBtn.classList.remove('on');
    personaBtn.classList.remove('on');
  }

  const tool = (name, title, onclick) => h('button', { class: 'tool', title, onclick }, icon(name, 18));

  const toolbar = h('div', { class: 'toolbar' },
    tool('scissors', 'Capture screenshot', async () => {
      try {
        addAttachment({ kind: 'image', name: 'Screenshot', dataUrl: await captureTab() });
      } catch {
        toast('This page cannot be captured');
      }
    }),
    tool('clip', 'Attach file', () => fileInput.click()),
    tool('read', 'Add page content', async () => {
      try {
        const page = await extractPage();
        addAttachment({ kind: 'text', name: page.title || 'Page', text: `Page: ${page.title}\n${page.url}\n\n${page.text}` });
      } catch {
        toast('This page cannot be read');
      }
    }),
    tool('at', 'Mention a model', (event) =>
      openMenu(event.currentTarget, MODELS.map((model) => ({
        label: model.label,
        onClick: () => {
          input.value = `@${model.id} ${input.value.replace(/^@[\w.-]+\s+/, '')}`;
          input.focus();
        }
      })))
    ),
    tool('sparkle', 'Improve prompt', (event) => enhance(event.currentTarget)),
    personaBtn
  );

  personaBtn.classList.toggle('on', session.persona.id !== 'none');
  personaBtn.addEventListener('click', () =>
    openMenu(personaBtn, [
      ...PERSONAS.map((persona) => ({
        label: persona.label,
        active: persona.id === session.persona.id,
        onClick: () => {
          session.persona = persona;
          personaBtn.classList.toggle('on', persona.id !== 'none');
          toast(`Persona: ${persona.label}`);
        }
      })),
      {
        label: 'Custom...',
        onClick: () => {
          const prompt = window.prompt('Describe how the assistant should behave');
          if (!prompt) return;
          session.persona = { id: 'custom', label: 'Custom', prompt };
          personaBtn.classList.add('on');
        }
      }
    ])
  );

  searchBtn.addEventListener('click', () => {
    session.search = !session.search;
    searchBtn.classList.toggle('on', session.search);
  });

  fileInput.addEventListener('change', async () => {
    for (const file of fileInput.files) {
      if (file.type.startsWith('image/')) addAttachment({ kind: 'image', name: file.name, dataUrl: await readDataUrl(file) });
      else addAttachment({ kind: 'text', name: file.name, text: (await file.text()).slice(0, 30000) });
    }
    fileInput.value = '';
  });

  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit(input.value);
    }
  });

  sendBtn.addEventListener('click', () => (session.controller ? session.controller.abort() : submit(input.value)));

  root.append(
    h('header', { class: 'head' },
      h('h1', { class: 'brand' }, h('img', { class: 'logo', src: '../../assets/logo.svg', alt: 'EchoGPT' }), 'EchoGPT'),
      h('div', { class: 'head-actions' },
        h('button', { class: 'btn primary', onclick: newChat }, icon('plus', 16), 'New Chat'),
        h('button', { class: 'icon-btn', title: 'History', onclick: () => ctx.navigate('history') }, icon('history', 20))
      )
    ),
    thread,
    h('section', { class: 'composer' },
      h('label', { class: 'model-chip' }, h('i', { class: 'dot' }), modelSelect(session.model, (id) => (session.model = id))),
      toolbar,
      chips,
      h('div', { class: 'input-box' }, input),
      h('footer', { class: 'composer-foot' },
        searchBtn,
        h('span', { class: 'hint' }, 'Enter to send · Shift+Enter new line'),
        sendBtn
      ),
      fileInput
    )
  );

  view = { drawThread, setSending, stream };
  setSending(Boolean(session.controller));
  drawChips();
  drawThread();
  if (payload?.text) {
    input.value = payload.text;
    autosize();
    input.focus();
  }
}
