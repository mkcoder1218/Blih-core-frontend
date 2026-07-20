import {
    AlignLeft,
    Bold,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Underline,
    Undo2,
} from "lucide-react";

import {
    useEffect,
    useRef,
    type ReactNode
} from "react";

interface ExitRichTextEditorProps {
    value: string;
    onChange: (value: string) => void;

    disabled?: boolean;
    minHeightClassName?: string;
}

interface ToolbarButton {
    command: string;
    value?: string;
    title: string;
    icon: ReactNode;
}

export default function ExitRichTextEditor({
    value,
    onChange,
    disabled = false,
    minHeightClassName = "min-h-[220px]",
}: ExitRichTextEditorProps) {
    const editorRef =
        useRef<HTMLDivElement>(null);

    useEffect(() => {
        const editor =
            editorRef.current;

        if (
            editor &&
            editor.innerHTML !== value
        ) {
            editor.innerHTML = value;
        }
    }, [value]);

    const execute = (
        command: string,
        commandValue?: string,
    ) => {
        if (disabled) {
            return;
        }

        document.execCommand(
            command,
            false,
            commandValue,
        );

        const editor =
            editorRef.current;

        if (editor) {
            editor.focus();
            onChange(editor.innerHTML);
        }
    };

    const buttons: ToolbarButton[] = [
        {
            command: "bold",
            title: "Bold",
            icon: <Bold className="h-4 w-4" />,
        },
        {
            command: "italic",
            title: "Italic",
            icon: <Italic className="h-4 w-4" />,
        },
        {
            command: "underline",
            title: "Underline",
            icon: <Underline className="h-4 w-4" />,
        },
        {
            command: "insertUnorderedList",
            title: "Bullet list",
            icon: <List className="h-4 w-4" />,
        },
        {
            command: "insertOrderedList",
            title: "Numbered list",
            icon: <ListOrdered className="h-4 w-4" />,
        },
        {
            command: "justifyLeft",
            title: "Align left",
            icon: <AlignLeft className="h-4 w-4" />,
        },
        {
            command: "undo",
            title: "Undo",
            icon: <Undo2 className="h-4 w-4" />,
        },
        {
            command: "redo",
            title: "Redo",
            icon: <Redo2 className="h-4 w-4" />,
        },
    ];

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                {buttons.map((button) => (
                    <button
                        key={button.command}
                        type="button"
                        title={button.title}
                        disabled={disabled}
                        onMouseDown={(event) => {
                            event.preventDefault();

                            execute(
                                button.command,
                                button.value,
                            );
                        }}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {button.icon}
                    </button>
                ))}

                <div className="mx-1 h-5 w-px bg-slate-200" />

                {[
                    {
                        label: "P",
                        value: "p",
                    },
                    {
                        label: "H1",
                        value: "h1",
                    },
                    {
                        label: "H2",
                        value: "h2",
                    },
                    {
                        label: "H3",
                        value: "h3",
                    },
                ].map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        disabled={disabled}
                        onMouseDown={(event) => {
                            event.preventDefault();

                            execute(
                                "formatBlock",
                                option.value,
                            );
                        }}
                        className="rounded-lg px-2 py-1.5 text-[10px] font-black text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={() => {
                    const editor = editorRef.current;

                    if (editor) {
                        onChange(editor.innerHTML);
                    }
                }}
                className={`${minHeightClassName} prose prose-sm max-w-none px-4 py-3 text-sm leading-7 text-slate-700 outline-none`}
            />
        </div>
    );
}