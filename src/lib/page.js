async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab) throw new Error('No active tab');
  return tab;
}

async function inject(func) {
  const tab = await activeTab();
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func });
  return result;
}

export const extractPage = () =>
  inject(() => ({
    title: document.title,
    url: location.href,
    selection: String(getSelection()),
    text: (document.querySelector('article') || document.body).innerText.slice(0, 30000)
  }));

export const extractVideo = () =>
  inject(() => {
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() || '';
    const segments = [...document.querySelectorAll('ytd-transcript-segment-renderer .segment-text, .ytp-caption-segment')]
      .map((el) => el.textContent.trim())
      .filter(Boolean);
    return {
      url: location.href,
      title: text('h1.ytd-watch-metadata') || document.title,
      channel: text('ytd-channel-name a') || document.querySelector('meta[name="author"]')?.content || '',
      description: document.querySelector('meta[name="description"]')?.content || '',
      transcript: segments.join(' ').slice(0, 30000),
      hasVideo: Boolean(document.querySelector('video'))
    };
  });

export const captureTab = () => chrome.tabs.captureVisibleTab({ format: 'png' });
