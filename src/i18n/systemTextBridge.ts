import { getCurrentLanguage, type AppLanguage } from './config';
import { translateSystemText } from './systemTextTranslations';
import { translateExtraSystemText } from './systemTextTranslationsExtra';
import { translateOverlayText } from './systemTextTranslationsOverlays';
import { translateWorkflowOverlayText } from './systemTextTranslationsWorkflows';
import { translateBrainSystemText } from './systemTextTranslationsBrain';

const ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;
const SKIP_SELECTOR = '[data-i18n-skip],script,style,code,pre,[contenteditable="true"]';

function shouldSkip(element: Element | null) {
  return Boolean(element?.closest(SKIP_SELECTOR));
}

function translateLegacySystemText(source: string, language: AppLanguage) {
  const brain = translateBrainSystemText(source, language);
  if (brain !== source) return brain;

  const workflow = translateWorkflowOverlayText(source, language);
  if (workflow !== source) return workflow;

  const overlay = translateOverlayText(source, language);
  if (overlay !== source) return overlay;

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

function installNativeDialogLocalization(language: AppLanguage) {
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;
  const originalPrompt = window.prompt;

  window.alert = (message?: unknown) => {
    const source = message == null ? '' : String(message);
    return originalAlert.call(window, translateLegacySystemText(source, language));
  };

  window.confirm = (message?: string) => {
    const source = message == null ? '' : String(message);
    return originalConfirm.call(window, translateLegacySystemText(source, language));
  };

  window.prompt = (message?: string, defaultValue?: string) => {
    const source = message == null ? '' : String(message);
    return originalPrompt.call(
      window,
      translateLegacySystemText(source, language),
      defaultValue,
    );
  };

  return () => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
    window.prompt = originalPrompt;
  };
}

/**
 * Runtime localization for the pre-i18n ERP UI.
 *
 * React/shadcn dialogs, dropdowns, popovers, sheets and toast portals are
 * normally mounted under document.body, so the MutationObserver below sees
 * them even when they render outside the page component tree.
 *
 * A separate native-dialog adapter also localizes window.alert/confirm/prompt,
 * which never enter the DOM and therefore cannot be observed.
 */
export function installSystemTextBridge() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => undefined;
  }

  const language = getCurrentLanguage();
  if (language === 'en') return () => undefined;

  const restoreNativeDialogs = installNativeDialogLocalization(language);

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
    restoreNativeDialogs();
    document.removeEventListener('DOMContentLoaded', start);
    document.removeEventListener('DOMContentLoaded', observe);
  };
}
