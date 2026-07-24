import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { toggleListAtSelection } from "./rich-text-list";

function createEditor() {
  return new Editor({
    element: null,
    extensions: [StarterKit],
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Alpha beta gamma" }],
        },
      ],
    },
  });
}

describe("toggleListAtSelection", () => {
  it("starts an empty bullet list at a caret after existing text", () => {
    const editor = createEditor();

    editor.commands.setTextSelection(17);
    toggleListAtSelection(editor, "bulletList");

    expect(editor.getJSON()).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Alpha beta gamma" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph" }],
            },
          ],
        },
      ],
    });
  });

  it("isolates selected words before applying an ordered list", () => {
    const editor = createEditor();

    editor.commands.setTextSelection({ from: 7, to: 11 });
    toggleListAtSelection(editor, "orderedList");

    expect(editor.getJSON()).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Alpha " }],
        },
        {
          type: "orderedList",
          attrs: {
            start: 1,
            type: null,
          },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "beta" }],
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: " gamma" }],
        },
      ],
    });
  });

  it("keeps whole-block selection as a standard list toggle", () => {
    const editor = createEditor();

    editor.commands.setTextSelection({ from: 1, to: 17 });
    toggleListAtSelection(editor, "bulletList");

    expect(editor.getJSON()).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Alpha beta gamma" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
