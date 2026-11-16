/**
 * Conversions between Confluence "storage format" (Confluence's XHTML) and
 * the plain text / Markdown the agent works with.
 */

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Confluence storage XHTML -> readable plain text for the agent. */
export function storageToText(xhtml) {
  if (!xhtml) return '';
  return String(xhtml)
    // Keep user mentions readable instead of dropping them.
    .replace(/<ri:user[^>]*ri:account-id="([^"]+)"[^>]*\/>/g, '@[$1]')
    // Tasks read as Markdown checkboxes.
    .replace(/<ac:task-id>[^<]*<\/ac:task-id>/g, '')
    .replace(/<ac:task-status>incomplete<\/ac:task-status>/g, '- [ ] ')
    .replace(/<ac:task-status>complete<\/ac:task-status>/g, '- [x] ')
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/tr|\/blockquote|\/ac:task)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<h([1-6])[^>]*>/gi, (_, level) => '#'.repeat(Number(level)) + ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Inline Markdown -> storage format.
 * Supports **bold**, *italic*, `code`, [links](https://...) and @[accountId]
 * mentions, which become real Confluence user mentions.
 */
function inline(text) {
  return escapeXml(text)
    .replace(/@\[([A-Za-z0-9:_-]+)\]/g, '<ac:link><ri:user ri:account-id="$1" /></ac:link>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Markdown written by the agent -> Confluence storage format.
 *
 * Handles headings, paragraphs, bullet and numbered lists, quotes (rendered as
 * an info panel) and task lists. `- [ ] Do the thing @[accountId]` becomes a
 * Confluence task assigned to that person.
 */
export function markdownToStorage(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let list = null; // 'ul' | 'ol' | 'task'
  let paragraph = [];
  let quote = [];
  let taskId = 1;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list === 'task') out.push('</ac:task-list>');
    else if (list) out.push(`</${list}>`);
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    out.push(
      '<ac:structured-macro ac:name="info"><ac:rich-text-body>' +
        quote.map((q) => `<p>${inline(q)}</p>`).join('') +
        '</ac:rich-text-body></ac:structured-macro>'
    );
    quote = [];
  };
  const openList = (type) => {
    if (list === type) return;
    closeList();
    out.push(type === 'task' ? '<ac:task-list>' : `<${type}>`);
    list = type;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushQuote();
      closeList();
      continue;
    }

    let match;
    if ((match = trimmed.match(/^(#{1,4})\s+(.*)$/))) {
      flushParagraph(); flushQuote(); closeList();
      const level = Math.min(match[1].length + 1, 4); // "#" becomes h2; the page title is the h1
      out.push(`<h${level}>${inline(match[2])}</h${level}>`);
    } else if ((match = trimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/))) {
      flushParagraph(); flushQuote(); openList('task');
      const status = match[1] === ' ' ? 'incomplete' : 'complete';
      out.push(
        `<ac:task><ac:task-id>${taskId++}</ac:task-id><ac:task-status>${status}</ac:task-status>` +
          `<ac:task-body>${inline(match[2])}</ac:task-body></ac:task>`
      );
    } else if ((match = trimmed.match(/^[-*]\s+(.*)$/))) {
      flushParagraph(); flushQuote(); openList('ul');
      out.push(`<li>${inline(match[1])}</li>`);
    } else if ((match = trimmed.match(/^\d+[.)]\s+(.*)$/))) {
      flushParagraph(); flushQuote(); openList('ol');
      out.push(`<li>${inline(match[1])}</li>`);
    } else if ((match = trimmed.match(/^>\s?(.*)$/))) {
      flushParagraph(); closeList();
      quote.push(match[1]);
    } else if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushParagraph(); flushQuote(); closeList();
      out.push('<hr />');
    } else {
      flushQuote(); closeList();
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  flushQuote();
  closeList();
  return out.join('\n');
}
