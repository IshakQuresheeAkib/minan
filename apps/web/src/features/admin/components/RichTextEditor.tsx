"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
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
};

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      className={cn(
        "size-9 rounded-lg border-transparent bg-transparent p-0 text-foreground/70 shadow-none transition-colors duration-200 hover:bg-primary/15 hover:text-foreground hover:shadow-none",
        active && "border-primary/35 bg-primary/20 text-foreground",
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
        class: "minan-rich-text minan-rich-text-editor",
        role: "textbox",
        "aria-label": "Product description",
        "aria-multiline": "true",
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
        "overflow-hidden rounded-xl border border-secondary bg-background transition-shadow focus-within:ring-2 focus-within:ring-primary/35",
        isInvalid && "border-destructive",
        disabled && "opacity-60",
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
        className="flex min-h-12 flex-wrap items-center gap-1 border-b border-secondary/70 bg-secondary/10 px-2 py-1.5"
      >
        <ToolbarButton
          active={editorState?.bold}
          disabled={editorUnavailable}
          label="Bold"
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
          onClick={() => {
            editor?.chain().focus().toggleItalic().run();
          }}
        >
          <Italic className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <span
          aria-hidden="true"
          className="mx-1 h-6 w-px bg-secondary"
        />
        <ToolbarButton
          active={editorState?.bulletList}
          disabled={editorUnavailable}
          label="Bullet list"
          onClick={() => {
            editor?.chain().focus().toggleBulletList().run();
          }}
        >
          <List className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          active={editorState?.orderedList}
          disabled={editorUnavailable}
          label="Numbered list"
          onClick={() => {
            editor?.chain().focus().toggleOrderedList().run();
          }}
        >
          <ListOrdered className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <span
          aria-hidden="true"
          className="mx-1 h-6 w-px bg-secondary"
        />
        <ToolbarButton
          disabled={editorUnavailable || !editorState?.canUndo}
          label="Undo"
          onClick={() => {
            editor?.chain().focus().undo().run();
          }}
        >
          <Undo2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          disabled={editorUnavailable || !editorState?.canRedo}
          label="Redo"
          onClick={() => {
            editor?.chain().focus().redo().run();
          }}
        >
          <Redo2 className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
});
