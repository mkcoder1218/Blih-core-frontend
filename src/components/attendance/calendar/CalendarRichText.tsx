import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
} from 'lucide-react';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'I', 'LI', 'OL', 'P', 'PRE', 'S', 'SPAN', 'STRONG', 'U', 'UL',
]);

const ALLOWED_STYLES = new Set([
  'color', 'background-color', 'font-weight', 'font-style',
  'text-decoration', 'text-align',
]);

function sanitizeStyle(styleValue: string) {
  return styleValue
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => {
      const property = declaration.split(':')[0]?.trim().toLowerCase();
      return Boolean(property && ALLOWED_STYLES.has(property));
    })
    .join('; ');
}

export function sanitizeCalendarHtml(value?: string | null) {
  if (!value) return '';
  if (typeof window === 'undefined') return value;

  const documentNode = new DOMParser().parseFromString(value, 'text/html');

  documentNode.body.querySelectorAll('*').forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const isSafeLink = element.tagName === 'A' && name === 'href';
      const isSafeStyle = name === 'style';

      if (!isSafeLink && !isSafeStyle) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (isSafeLink) {
        const href = attribute.value.trim();
        if (!/^(https?:|mailto:|tel:)/i.test(href)) {
          element.removeAttribute('href');
        } else {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noreferrer noopener');
        }
      }

      if (isSafeStyle) {
        const safeStyle = sanitizeStyle(attribute.value);
        if (safeStyle) element.setAttribute('style', safeStyle);
        else element.removeAttribute('style');
      }
    });
  });

  return documentNode.body.innerHTML;
}

export function isRichTextEmpty(value?: string | null) {
  if (!value) return true;
  if (typeof window === 'undefined') {
    return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0;
  }

  const documentNode = new DOMParser().parseFromString(value, 'text/html');
  return (documentNode.body.textContent || '').replace(/\u00a0/g, ' ').trim().length === 0;
}

interface ToolbarButton {
  title: string;
  command: string;
  icon: ReactNode;
}

interface CalendarRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const toolbarButtons: ToolbarButton[] = [
  { title: 'Bold', command: 'bold', icon: <Bold className="h-3.5 w-3.5" /> },
  { title: 'Italic', command: 'italic', icon: <Italic className="h-3.5 w-3.5" /> },
  { title: 'Underline', command: 'underline', icon: <Underline className="h-3.5 w-3.5" /> },
  { title: 'Bullet list', command: 'insertUnorderedList', icon: <List className="h-3.5 w-3.5" /> },
  { title: 'Numbered list', command: 'insertOrderedList', icon: <ListOrdered className="h-3.5 w-3.5" /> },
  { title: 'Add link', command: 'createLink', icon: <Link className="h-3.5 w-3.5" /> },
  { title: 'Clear formatting', command: 'removeFormat', icon: <RemoveFormatting className="h-3.5 w-3.5" /> },
];

export function CalendarRichTextEditor({
  value,
  onChange,
  placeholder = 'Add a description…',
  disabled = false,
  className,
}: CalendarRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string) => {
    if (disabled) return;

    let commandValue: string | undefined;
    if (command === 'createLink') {
      const href = window.prompt('Paste the link');
      if (!href) return;
      commandValue = href;
    }

    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    onChange(sanitizeCalendarHtml(editorRef.current?.innerHTML || ''));
  };

  return (
    <div className={cn('calendar-rich-editor overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <div className="flex min-h-9 flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1">
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            title={button.title}
            disabled={disabled}
            onMouseDown={(event) => {
              event.preventDefault();
              runCommand(button.command);
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div className="relative">
        {isRichTextEmpty(value) && (
          <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-slate-400">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={() => onChange(sanitizeCalendarHtml(editorRef.current?.innerHTML || ''))}
          onPaste={(event) => {
            event.preventDefault();
            const html = event.clipboardData.getData('text/html');
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, sanitizeCalendarHtml(html || text));
          }}
          className="min-h-[88px] max-h-[150px] overflow-y-auto px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none"
        />
      </div>
    </div>
  );
}

interface CalendarRichTextViewerProps {
  value?: string | null;
  className?: string;
  compact?: boolean;
}

export function CalendarRichTextViewer({ value, className, compact = false }: CalendarRichTextViewerProps) {
  const html = useMemo(() => sanitizeCalendarHtml(value), [value]);
  if (isRichTextEmpty(html)) return null;

  return (
    <div
      className={cn(
        'calendar-rich-viewer break-words text-slate-600',
        compact ? 'text-xs leading-5' : 'text-sm leading-6',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
