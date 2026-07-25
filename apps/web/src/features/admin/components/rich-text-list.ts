import type { ChainedCommands, Editor } from "@tiptap/core";

export type ListType = "bulletList" | "orderedList";

function runListCommand(
  chain: ChainedCommands,
  listType: ListType,
): boolean {
  return listType === "bulletList"
    ? chain.toggleBulletList().run()
    : chain.toggleOrderedList().run();
}

export function toggleListAtSelection(
  editor: Editor,
  listType: ListType,
): boolean {
  const { selection } = editor.state;
  const { $from, $to } = selection;
  const isInsideList =
    editor.isActive("bulletList") || editor.isActive("orderedList");
  const isSingleTextBlock =
    $from.sameParent($to) && $from.parent.isTextblock;

  if (isInsideList || !isSingleTextBlock) {
    return runListCommand(editor.chain(), listType);
  }

  const startsAtBlockStart = $from.parentOffset === 0;
  const endsAtBlockEnd =
    $to.parentOffset === $to.parent.content.size;

  if (selection.empty) {
    if ($from.parent.content.size === 0 || startsAtBlockStart) {
      return runListCommand(editor.chain(), listType);
    }

    return runListCommand(editor.chain().splitBlock(), listType);
  }

  if (startsAtBlockStart && endsAtBlockEnd) {
    return runListCommand(editor.chain(), listType);
  }

  let chain = editor.chain();

  if (!endsAtBlockEnd) {
    chain = chain.setTextSelection(selection.to).splitBlock();
  }

  if (!startsAtBlockStart) {
    chain = chain.setTextSelection(selection.from).splitBlock();
  } else {
    chain = chain.setTextSelection(selection.from);
  }

  return runListCommand(chain, listType);
}
