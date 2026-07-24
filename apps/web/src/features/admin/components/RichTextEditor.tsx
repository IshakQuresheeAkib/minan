"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";
import {
  forwardRef,
  useEffect,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/Button";
import { toggleListAtSelection } from "@/features/admin/components/rich-text-list";
import { cn } from "@/lib/utils";

type RichTextEditorProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange"
> & {
  disabled?: boolean;
  onChange: (html: string) => void;
  onBlur?: () => void;
  value: string;
};

type ToolbarButtonProps = {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  shortcut?: string;
  shortcutLabel?: string;
};

function ToolbarButton({
  active,
  children,
  disabled = false,
  label,
  onClick,
  shortcut,
  shortcutLabel,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      title={shortcutLabel ? `${label} (${shortcutLabel})` : label}
      className={cn(
        "size-8 shrink-0 rounded-md border-transparent bg-transparent p-0 text-foreground/65 shadow-none transition-colors duration-200 hover:bg-primary/15 hover:text-foreground hover:shadow-none focus-visible:ring-2",
        active && "border-primary/40 bg-primary/20 text-foreground",
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export const RichTextEditor = forwardRef<
  HTMLDivElement,
  RichTextEditorProps
>(function RichTextEditor(
  {
    className,
    disabled = false,
    id,
    onBlur,
    onChange,
    onFocus,
    value,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  },
  forwardedRef,
) {
  const isInvalid = ariaInvalid === true || ariaInvalid === "true";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        strike: false,
        underline: false,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "minan-rich-text minan-rich-text-editor selection:bg-primary/30",
        role: "textbox",
        "aria-label": "Product description",
        "aria-multiline": "true",
        "aria-disabled": disabled ? "true" : "false",
        "aria-invalid": isInvalid ? "true" : "false",
        ...(ariaDescribedBy
          ? { "aria-describedby": ariaDescribedBy }
          : {}),
        ...(id ? { id } : {}),
        spellcheck: "true",
      },
    },
    onBlur,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });
  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
      canRedo:
        currentEditor?.can().chain().focus().redo().run() ?? false,
      canUndo:
        currentEditor?.can().chain().focus().undo().run() ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      orderedList: currentEditor?.isActive("orderedList") ?? false,
    }),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) {
      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const editorUnavailable = !editor || disabled;

  return (
    <div
      {...props}
      ref={forwardedRef}
      tabIndex={-1}
      className={cn(
        "overflow-hidden rounded-lg border border-secondary/80 bg-background transition-[border-color,box-shadow] duration-200 focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/25",
        isInvalid &&
          "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        disabled && "bg-secondary/5 opacity-60",
        className,
      )}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.target === event.currentTarget) {
          editor?.commands.focus("end");
        }
      }}
    >
      <div
        role="toolbar"
        aria-label="Description formatting"
        aria-orientation="horizontal"
        className="flex min-h-11 items-center gap-1 overflow-x-auto border-b border-secondary/70 bg-secondary/10 p-1.5"
      >
        <div
          role="group"
          aria-label="Text style"
          className="flex items-center gap-1"
        >
          <ToolbarButton
            active={editorState?.bold}
            disabled={editorUnavailable}
            label="Bold"
            shortcut="Control+b Meta+b"
            shortcutLabel="Ctrl+B"
            onClick={() => {
              editor?.chain().focus().toggleBold().run();
            }}
          >
            <Bold className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editorState?.italic}
            disabled={editorUnavailable}
            label="Italic"
            shortcut="Control+i Meta+i"
            shortcutLabel="Ctrl+I"
            onClick={() => {
              editor?.chain().focus().toggleItalic().run();
            }}
          >
            <Italic className="size-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
        <span
          role="separator"
          aria-orientation="vertical"
          className="mx-0.5 h-5 w-px shrink-0 bg-secondary/80"
        />
        <div
          role="group"
          aria-label="Lists"
          className="flex items-center gap-1"
        >
          <ToolbarButton
            active={editorState?.bulletList}
            disabled={editorUnavailable}
            label="Bulleted list"
            shortcut="Control+Shift+8 Meta+Shift+8"
            shortcutLabel="Ctrl+Shift+8"
            onClick={() => {
              if (editor) {
                editor.commands.focus();
                toggleListAtSelection(editor, "bulletList");
              }
            }}
          >
            <List className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            active={editorState?.orderedList}
            disabled={editorUnavailable}
            label="Numbered list"
            shortcut="Control+Shift+7 Meta+Shift+7"
            shortcutLabel="Ctrl+Shift+7"
            onClick={() => {
              if (editor) {
                editor.commands.focus();
                toggleListAtSelection(editor, "orderedList");
              }
            }}
          >
            <ListOrdered className="size-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
        <span
          role="separator"
          aria-orientation="vertical"
          className="mx-0.5 h-5 w-px shrink-0 bg-secondary/80"
        />
        <div
          role="group"
          aria-label="History"
          className="ml-auto flex items-center gap-1"
        >
          <ToolbarButton
            disabled={editorUnavailable || !editorState?.canUndo}
            label="Undo"
            shortcut="Control+z Meta+z"
            shortcutLabel="Ctrl+Z"
            onClick={() => {
              editor?.chain().focus().undo().run();
            }}
          >
            <Undo2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            disabled={editorUnavailable || !editorState?.canRedo}
            label="Redo"
            shortcut="Control+Shift+z Meta+Shift+z"
            shortcutLabel="Ctrl+Shift+Z"
            onClick={() => {
              editor?.chain().focus().redo().run();
            }}
          >
            <Redo2 className="size-4" aria-hidden="true" />
          </ToolbarButton>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
});
