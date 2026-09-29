export async function webSearch(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url);
  const data = await response.json();
  const results = [];
  if (data.AbstractText) results.push({ text: data.AbstractText, url: data.AbstractURL });
  for (const topic of data.RelatedTopics || []) {
    if (topic.Text) results.push({ text: topic.Text, url: topic.FirstURL });
  }
  return results.slice(0, 5);
}
