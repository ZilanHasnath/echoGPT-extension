chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.contextMenus.create({ id: 'echogpt-ask', title: 'Ask EchoGPT about "%s"', contexts: ['selection'] });
  chrome.contextMenus.create({ id: 'echogpt-translate', title: 'Translate with EchoGPT', contexts: ['selection'] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
  const view = info.menuItemId === 'echogpt-translate' ? 'translate' : 'chat';
  chrome.storage.session.set({ pending: { view, text: info.selectionText } });
});
