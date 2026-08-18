import { getCurrentLanguage, type AppLanguage } from './config';
import { translateSystemText } from './systemTextTranslations';
import { translateExtraSystemText } from './systemTextTranslationsExtra';

const ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;
const SKIP_SELECTOR = '[data-i18n-skip],script,style,code,pre,[contenteditable="true"]';

function shouldSkip(element: Element | null) {
  return Boolean(element?.closest(SKIP_SELECTOR));
}

function translateLegacySystemText(source: string, language: AppLanguage) {
  const exact = translateExtraSystemText(source, language);
  if (exact !== source) return exact;
  return translateSystemText(source, language);
}

function translateTextNode(node: Text, language: AppLanguage) {
  if (shouldSkip(node.parentElement)) return;

  const current = node.nodeValue ?? '';
  const trimmed = current.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return;

  const translated = translateLegacySystemText(trimmed, language);
  if (translated === trimmed) return;

  const leading = current.match(/^\s*/)?.[0] ?? '';
  const trailing = current.match(/\s*$/)?.[0] ?? '';
  node.nodeValue = `${leading}${translated}${trailing}`;
}

function translateElementAttributes(element: Element, language: AppLanguage) {
  if (shouldSkip(element)) return;

  for (const attribute of ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current || !/[A-Za-z]/.test(current)) continue;

    const translated = translateLegacySystemText(current, language);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
}

function translateTree(root: Node, language: AppLanguage) {
  if (language === 'en') return;

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text, language);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root instanceof Element) translateElementAttributes(root, language);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, language);
    else translateElementAttributes(node as Element, language);
  }
}

/**
 * Second-pass localization for the pre-i18n ERP UI.
 *
 * The original bridge translates exact catalog values. This pass covers the
 * remaining hard-coded system phrases using normalized/compound matching.
 * The language switch reloads the route, so the active language is stable for
 * the lifetime of this observer.
 */
export function installSystemTextBridge() {
  if (typeof document === 'undefined') return () => undefined;

  const language = getCurrentLanguage();
  if (language === 'en') return () => undefined;

  const start = () => translateTree(document.body, language);
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        translateTree(mutation.target, language);
      }
      mutation.addedNodes.forEach((node) => translateTree(node, language));
    }
  });

  const observe = () => {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });
  };

  if (document.body) observe();
  else document.addEventListener('DOMContentLoaded', observe, { once: true });

  return () => {
    observer.disconnect();
    document.removeEventListener('DOMContentLoaded', start);
    document.removeEventListener('DOMContentLoaded', observe);
  };
}
