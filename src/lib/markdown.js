const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s"]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function blocks(text) {
  const out = [];
  let list = null;
  const flush = () => {
    if (list) out.push(`<${list.tag}>${list.items.join('')}</${list.tag}>`);
    list = null;
  };
  for (const line of text.split('\n')) {
    const heading = line.match(/^(#{1,3})\s+(.*)/);
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const number = line.match(/^\s*\d+\.\s+(.*)/);
    if (heading) {
      flush();
      const level = heading[1].length + 2;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet || number) {
      const tag = bullet ? 'ul' : 'ol';
      if (list && list.tag !== tag) flush();
      list = list || { tag, items: [] };
      list.items.push(`<li>${inline((bullet || number)[1])}</li>`);
    } else if (line.trim()) {
      flush();
      out.push(`<p>${inline(line)}</p>`);
    } else {
      flush();
    }
  }
  flush();
  return out.join('');
}

export function renderMarkdown(source) {
  return escapeHtml(source)
    .split('```')
    .map((part, index) => (index % 2 ? `<pre><code>${part.replace(/^[^\n]*\n/, '')}</code></pre>` : blocks(part)))
    .join('');
}
