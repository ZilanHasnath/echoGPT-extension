export const PROVIDERS = {
  openai: { label: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
  anthropic: { label: 'Anthropic', keyUrl: 'https://console.anthropic.com/settings/keys' },
  google: { label: 'Google', keyUrl: 'https://aistudio.google.com/apikey' }
};

export const MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai' },
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet', provider: 'anthropic' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku', provider: 'anthropic' },
  { id: 'gemini-2.5-pro', label: 'Gemini Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', label: 'Gemini Flash', provider: 'google' }
];

export const NAV = [
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'write', label: 'Write', icon: 'write' },
  { id: 'read', label: 'Read', icon: 'read' },
  { id: 'translate', label: 'Translate', icon: 'translate' },
  { id: 'image', label: 'Image', icon: 'image' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'compare', label: 'Compare', icon: 'compare' },
  { id: 'mcp', label: 'MCP', icon: 'mcp' }
];

export const QUICK_ACTIONS = [
  { view: 'write', label: 'Write', icon: 'write', tone: 'violet' },
  { view: 'translate', label: 'Translate', icon: 'translate', tone: 'blue' },
  { view: 'read', label: 'Read page', icon: 'read', tone: 'green' },
  { view: 'image', label: 'Image', icon: 'image', tone: 'pink' },
  { view: 'video', label: 'Video', icon: 'video', tone: 'amber' },
  { view: 'compare', label: 'Compare', icon: 'compare', tone: 'sky' },
  { view: 'mcp', label: 'MCP', icon: 'mcp', tone: 'slate' }
];

export const SUGGESTIONS = [
  'Tell me an interesting fun fact',
  'Explain quantum computing in simple terms',
  'Recommend 5 great sci-fi movies'
];

export const PERSONAS = [
  { id: 'none', label: 'Default', prompt: '' },
  { id: 'engineer', label: 'Senior engineer', prompt: 'You are a senior software engineer. Give precise, correct answers with concise, idiomatic code.' },
  { id: 'editor', label: 'Editor', prompt: 'You are a meticulous editor. Improve clarity, structure and tone while preserving the author\'s voice.' },
  { id: 'teacher', label: 'Teacher', prompt: 'You are a patient teacher. Explain step by step with simple language and concrete examples.' },
  { id: 'analyst', label: 'Analyst', prompt: 'You are a sharp analyst. Be structured, quantitative where possible, and state assumptions explicitly.' }
];

export const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Bengali', 'Hindi', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Turkish'];
export const TONES = ['Professional', 'Friendly', 'Persuasive', 'Casual', 'Formal', 'Concise'];
export const FORMATS = ['Email', 'Blog post', 'Social post', 'Summary', 'Cover letter', 'Message'];
export const LENGTHS = ['Short', 'Medium', 'Long'];
export const IMAGE_SIZES = ['1024x1024', '1792x1024', '1024x1792'];
