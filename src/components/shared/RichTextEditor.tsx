import {
  useCallback,
  useMemo,
  useRef,
} from "react";

import type {
  ComponentType,
  CSSProperties,
} from "react";

import ReactQuillImport from "react-quill-new";

import {
  Braces,
} from "lucide-react";

import "react-quill-new/dist/quill.snow.css";

type QuillSelection = {
  index: number;
  length: number;
} | null;

type QuillEditorInstance = {
  getSelection: (
    focus?: boolean,
  ) => QuillSelection;

  getLength: () => number;

  insertText: (
    index: number,
    text: string,
    source?: string,
  ) => void;

  setSelection: (
    index: number,
    length: number,
    source?: string,
  ) => void;
};

type ReactQuillInstance = {
  getEditor: () => QuillEditorInstance;
};

interface ReactQuillComponentProps {
  ref?: React.Ref<ReactQuillInstance>;

  theme?: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  readOnly?: boolean;

  modules?: Record<string, unknown>;

  formats?: string[];

  placeholder?: string;

  style?: CSSProperties;

  className?: string;
}

const ReactQuill =
  ReactQuillImport as unknown as ComponentType<ReactQuillComponentProps>;

export interface RichTextVariable {
  key: string;
  label: string;
}

interface RichTextEditorProps {
  value: string;

  onChange: (
    value: string,
  ) => void;

  label?: string;

  description?: string;

  placeholder?: string;

  variables?: RichTextVariable[];

  disabled?: boolean;

  required?: boolean;

  minHeight?: number;

  maxHeight?: number;

  error?: string;

  className?: string;
}

const DEFAULT_FORMATS = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "blockquote",
  "code-block",
  "list",
  "indent",
  "align",
  "direction",
  "link",
  "clean",
];

export default function RichTextEditor({
  value,
  onChange,
  label,
  description,
  placeholder =
    "Write your document content...",
  variables = [],
  disabled = false,
  required = false,
  minHeight = 260,
  maxHeight = 520,
  error,
  className = "",
}: RichTextEditorProps) {
  const editorRef =
    useRef<ReactQuillInstance | null>(
      null,
    );

  const modules =
    useMemo<
      Record<string, unknown>
    >(
      () => ({
        toolbar: [
          [
            {
              header: [
                1,
                2,
                3,
                false,
              ],
            },
          ],

          [
            "bold",
            "italic",
            "underline",
            "strike",
          ],

          [
            {
              color: [],
            },

            {
              background: [],
            },
          ],

          [
            {
              list: "ordered",
            },

            {
              list: "bullet",
            },

            {
              indent: "-1",
            },

            {
              indent: "+1",
            },
          ],

          [
            {
              align: [],
            },
          ],

          [
            "blockquote",
            "code-block",
          ],

          [
            "link",
          ],

          [
            "clean",
          ],
        ],

        clipboard: {
          matchVisual: false,
        },
      }),
      [],
    );

  const insertVariable =
    useCallback(
      (
        variableKey: string,
      ) => {
        if (disabled) {
          return;
        }

        const variable =
          `{{${variableKey}}}`;

        const editor =
          editorRef.current?.getEditor();

        if (!editor) {
          onChange(
            `${value}${variable}`,
          );

          return;
        }

        const selection =
          editor.getSelection(true);

        const index =
          selection?.index ??
          Math.max(
            editor.getLength() - 1,
            0,
          );

        editor.insertText(
          index,
          variable,
          "user",
        );

        editor.setSelection(
          index +
            variable.length,
          0,
          "silent",
        );
      },
      [
        disabled,
        onChange,
        value,
      ],
    );

  return (
    <div
      className={[
        "space-y-2",
        className,
      ].join(" ")}
    >
      {label ? (
        <div>
          <label className="text-xs font-black text-slate-800">
            {label}

            {required ? (
              <span className="ml-1 text-rose-500">
                *
              </span>
            ) : null}
          </label>

          {description ? (
            <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {variables.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Braces className="h-3.5 w-3.5 text-blue-600" />

            <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
              Insert variable
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {variables.map(
              (
                variable,
              ) => (
                <button
                  key={
                    variable.key
                  }
                  type="button"
                  disabled={
                    disabled
                  }
                  onClick={() =>
                    insertVariable(
                      variable.key,
                    )
                  }
                  className="rounded-md border border-blue-200 bg-white px-2 py-1 text-[10px] font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`Insert {{${variable.key}}}`}
                >
                  {
                    variable.label
                  }
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}

      <div
        className={[
          "overflow-hidden rounded-xl border bg-white",
          error
            ? "border-rose-300 ring-2 ring-rose-100"
            : "border-slate-200",
          disabled
            ? "opacity-70"
            : "",
        ].join(" ")}
      >
        <ReactQuill
          ref={
            editorRef
          }
          theme="snow"
          value={
            value
          }
          onChange={
            onChange
          }
          readOnly={
            disabled
          }
          modules={
            modules
          }
          formats={
            DEFAULT_FORMATS
          }
          placeholder={
            placeholder
          }
          style={{
            minHeight,
            maxHeight,
          }}
        />
      </div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-600">
          {error}
        </p>
      ) : null}

      <style>
        {`
          .ql-toolbar.ql-snow {
            border: 0;
            border-bottom: 1px solid rgb(226 232 240);
            background: rgb(248 250 252);
          }

          .ql-container.ql-snow {
            border: 0;
            font-family: inherit;
            min-height: ${minHeight}px;
            max-height: ${maxHeight}px;
            overflow-y: auto;
          }

          .ql-editor {
            min-height: ${minHeight}px;
            padding: 18px;
            font-size: 13px;
            line-height: 1.7;
            color: rgb(30 41 59);
          }

          .ql-editor.ql-blank::before {
            color: rgb(148 163 184);
            font-style: normal;
          }
        `}
      </style>
    </div>
  );
}
