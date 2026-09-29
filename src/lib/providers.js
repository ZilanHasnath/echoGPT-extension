import { MODELS, PROVIDERS } from './constants.js';

export const findModel = (id) => MODELS.find((model) => model.id === id) || MODELS[0];

const parseDataUrl = (url) => {
  const [head, data] = url.split(',');
  return { mime: head.match(/data:(.*);base64/)[1], data };
};

async function assertOk(response) {
  if (response.ok) return;
  let detail = response.statusText;
  try {
    const body = await response.json();
    detail = body.error?.message || body.message || JSON.stringify(body);
  } catch {
    detail = response.statusText;
  }
  throw new Error(`${response.status}: ${detail}`);
}

async function readEvents(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data && data !== '[DONE]') onEvent(JSON.parse(data));
    }
  }
}

function requireKey(settings, provider) {
  const key = settings.keys[provider];
  if (!key) throw new Error(`Add your ${PROVIDERS[provider].label} API key in Settings.`);
  return key;
}

const adapters = {
  async openai({ model, key, system, messages, signal, onToken }) {
    const body = {
      model,
      stream: true,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages.map((m) => ({
          role: m.role,
          content: m.images?.length
            ? [{ type: 'text', text: m.text }, ...m.images.map((url) => ({ type: 'image_url', image_url: { url } }))]
            : m.text
        }))
      ]
    };
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body)
    });
    await assertOk(response);
    await readEvents(response, (event) => {
      const token = event.choices?.[0]?.delta?.content;
      if (token) onToken(token);
    });
  },

  async anthropic({ model, key, system, messages, signal, onToken, mcpServers }) {
    const body = {
      model,
      max_tokens: 4096,
      stream: true,
      ...(system ? { system } : {}),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.images?.length
          ? [
              ...m.images.map((url) => {
                const { mime, data } = parseDataUrl(url);
                return { type: 'image', source: { type: 'base64', media_type: mime, data } };
              }),
              { type: 'text', text: m.text }
            ]
          : m.text
      }))
    };
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    if (mcpServers.length) {
      body.mcp_servers = mcpServers.map((s) => ({
        type: 'url',
        url: s.url,
        name: s.name.replace(/[^a-z0-9_-]/gi, '-'),
        ...(s.token ? { authorization_token: s.token } : {})
      }));
      headers['anthropic-beta'] = 'mcp-client-2025-04-04';
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers,
      body: JSON.stringify(body)
    });
    await assertOk(response);
    await readEvents(response, (event) => {
      if (event.type === 'content_block_delta' && event.delta?.text) onToken(event.delta.text);
    });
  },

  async google({ model, key, system, messages, signal, onToken }) {
    const body = {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [
          { text: m.text },
          ...(m.images || []).map((url) => {
            const { mime, data } = parseDataUrl(url);
            return { inlineData: { mimeType: mime, data } };
          })
        ]
      }))
    };
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body)
    });
    await assertOk(response);
    await readEvents(response, (event) => {
      event.candidates?.[0]?.content?.parts?.forEach((part) => part.text && onToken(part.text));
    });
  }
};

export async function streamChat({ settings, modelId, system = '', messages, signal, onToken, mcp = false }) {
  const model = findModel(modelId);
  const key = requireKey(settings, model.provider);
  const mcpServers = mcp && model.provider === 'anthropic' ? settings.mcpServers.filter((s) => s.enabled) : [];
  await adapters[model.provider]({ model: model.id, key, system, messages, signal, onToken, mcpServers });
}

export async function completeText(options) {
  let text = '';
  await streamChat({ ...options, onToken: (token) => (text += token) });
  return text;
}

export async function generateImage({ settings, prompt, size, signal }) {
  const key = requireKey(settings, 'openai');
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'dall-e-3', prompt, size, n: 1, response_format: 'b64_json' })
  });
  await assertOk(response);
  const { data } = await response.json();
  return `data:image/png;base64,${data[0].b64_json}`;
}
