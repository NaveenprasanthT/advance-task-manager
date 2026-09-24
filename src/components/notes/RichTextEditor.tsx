"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { CharacterCount } from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { MAX_NOTE_DESCRIPTION_LENGTH } from "@/lib/note-constants";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      CharacterCount.configure({ limit: MAX_NOTE_DESCRIPTION_LENGTH }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      return {
        isBold: e?.isActive("bold") ?? false,
        isItalic: e?.isActive("italic") ?? false,
        isUnderline: e?.isActive("underline") ?? false,
        isStrike: e?.isActive("strike") ?? false,
        isH1: e?.isActive("heading", { level: 1 }) ?? false,
        isH2: e?.isActive("heading", { level: 2 }) ?? false,
        isH3: e?.isActive("heading", { level: 3 }) ?? false,
        isBulletList: e?.isActive("bulletList") ?? false,
        isOrderedList: e?.isActive("orderedList") ?? false,
        isBlockquote: e?.isActive("blockquote") ?? false,
        isCodeBlock: e?.isActive("codeBlock") ?? false,
        isLink: e?.isActive("link") ?? false,
        canUndo: e?.can().undo() ?? false,
        canRedo: e?.can().redo() ?? false,
        characters: e?.storage.characterCount.characters() ?? 0,
      };
    },
  }) ?? {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrike: false,
    isH1: false,
    isH2: false,
    isH3: false,
    isBulletList: false,
    isOrderedList: false,
    isBlockquote: false,
    isCodeBlock: false,
    isLink: false,
    canUndo: false,
    canRedo: false,
    characters: 0,
  };

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "");
    if (url === null) return;
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
        <Toggle size="sm" pressed={state.isBold} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-3.5" />
        </Toggle>
        <Toggle size="sm" pressed={state.isItalic} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isUnderline}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </Toggle>
        <Toggle size="sm" pressed={state.isStrike} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="size-3.5" />
        </Toggle>
        <div className="mx-1 h-5 w-px bg-border" />
        <Toggle
          size="sm"
          pressed={state.isH1}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isH2}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isH3}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-3.5" />
        </Toggle>
        <div className="mx-1 h-5 w-px bg-border" />
        <Toggle
          size="sm"
          pressed={state.isBulletList}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isOrderedList}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isBlockquote}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.isCodeBlock}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-3.5" />
        </Toggle>
        <Toggle size="sm" pressed={state.isLink} onPressedChange={setLink}>
          <LinkIcon className="size-3.5" />
        </Toggle>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="size-3.5" />
        </Button>
      </div>

      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto p-3" />

      <div
        className={cn(
          "border-t px-3 py-1.5 text-right text-xs text-muted-foreground",
          state.characters >= MAX_NOTE_DESCRIPTION_LENGTH && "text-destructive",
        )}
      >
        {state.characters.toLocaleString()} / {MAX_NOTE_DESCRIPTION_LENGTH.toLocaleString()} characters
      </div>
    </div>
  );
}
