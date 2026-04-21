import type MarkdownIt from 'markdown-it';

export interface WidgetRenderOptions {
  locale: string;
  widgetId?: string;
  widgetRunId?: string;
  recordId?: string;
}

export function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function unescapeHtmlAttr(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function formatJsonWithHighlight(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);
    const formatted = JSON.stringify(obj, null, 2);
    return formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="json-null">$1</span>');
  } catch {
    return jsonStr;
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function createMarkdownItWidgetPlugin(options: WidgetRenderOptions) {
  return function markdownItWidgetPlugin(md: MarkdownIt): void {
    const defaultFence = md.renderer.rules.fence!;

    md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
      const token = tokens[idx];
      if (!token) {
        return '';
      }
      const info = token.info.trim();

      if (info === 'adp-widget' || info.startsWith('adp-widget ')) {
        const widgetJson = token.content.trim();

        let parsedWidgetId = '';
        let parsedWidgetRunId = '';
        try {
          const widgetObj = JSON.parse(widgetJson);
          if (widgetObj._adp_widget_meta) {
            parsedWidgetId = widgetObj._adp_widget_meta.widgetId || '';
            parsedWidgetRunId = widgetObj._adp_widget_meta.widgetRunId || '';
          }
        } catch {
          // Keep fallback empty ids when widget metadata cannot be parsed.
        }

        const actualWidgetId = parsedWidgetId || options.widgetId || '';
        const actualWidgetRunId = parsedWidgetRunId || options.widgetRunId || '';
        const elementId = `widget-${simpleHash(widgetJson)}-${idx}`;

        return `<div class="adp-widget-wrapper" data-widget-id="${actualWidgetId}" data-widget-run-id="${actualWidgetRunId}" data-record-id="${options.recordId || ''}" data-element-id="${elementId}">
        <adp-widget 
          id="${elementId}"
          locale="${options.locale}"
          widget-json="${escapeHtmlAttr(widgetJson)}"
        ></adp-widget>
      </div>`;
      }

      return defaultFence(tokens, idx, opts, env, self);
    };
  };
}

export function showFallbackJson(wrappers: NodeListOf<Element>): void {
  wrappers.forEach((wrapper) => {
    const widgetEl = wrapper.querySelector('adp-widget');
    if (!widgetEl) return;

    const encodedJson = widgetEl.getAttribute('widget-json') || '';
    const originalJson = unescapeHtmlAttr(encodedJson);

    const fallbackEl = document.createElement('div');
    fallbackEl.className = 'adp-widget-fallback';
    fallbackEl.innerHTML = `
      <div class="fallback-header">
        <span class="fallback-icon">⚠️</span>
        <span class="fallback-title">Widget 加载失败</span>
      </div>
      <div class="fallback-content">
        <pre class="fallback-json"><code>${formatJsonWithHighlight(originalJson)}</code></pre>
      </div>
    `;

    wrapper.innerHTML = '';
    wrapper.appendChild(fallbackEl);
  });
}
