'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { useEffect, useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  Minus,
  Undo,
  Redo,
  Code,
  Type,
  ALargeSmall,
  WrapText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 커스텀 FontSize Extension
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// 커스텀 LineHeight Extension
const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element) => {
              return element.style.lineHeight || null;
            },
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.updateAttributes(type, { lineHeight })
          );
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.resetAttributes(type, 'lineHeight')
          );
        },
    };
  },
});

interface WysiwygEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_FAMILIES = [
  { value: 'default', label: '기본 폰트' },
  { value: 'Pretendard', label: 'Pretendard' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
];

const FONT_SIZES = [
  { value: 'default', label: '기본 크기' },
  { value: '10px', label: '10px' },
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' },
  { value: '28px', label: '28px' },
  { value: '32px', label: '32px' },
  { value: '36px', label: '36px' },
  { value: '48px', label: '48px' },
];

const LINE_HEIGHTS = [
  { value: 'default', label: '기본' },
  { value: '1', label: '1.0' },
  { value: '1.2', label: '1.2' },
  { value: '1.5', label: '1.5' },
  { value: '1.8', label: '1.8' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
];

// Editor commands 타입 확장
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export function WysiwygEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  className = '',
}: WysiwygEditorProps) {
  // 현재 선택된 스타일 상태 추적
  const [currentFontFamily, setCurrentFontFamily] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState('default');
  const [currentLineHeight, setCurrentLineHeight] = useState('default');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 외부에서 content가 변경될 때 에디터 업데이트
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // 선택 영역 변경 시 현재 스타일 업데이트
  useEffect(() => {
    if (!editor) return;

    const updateCurrentStyles = () => {
      // 폰트 패밀리
      const fontFamily = editor.getAttributes('textStyle').fontFamily;
      setCurrentFontFamily(fontFamily || 'default');

      // 폰트 사이즈
      const fontSize = editor.getAttributes('textStyle').fontSize;
      setCurrentFontSize(fontSize || 'default');

      // 줄 간격 (paragraph 또는 heading에서 가져옴)
      const paragraphLineHeight = editor.getAttributes('paragraph').lineHeight;
      const headingLineHeight = editor.getAttributes('heading').lineHeight;
      const lineHeight = paragraphLineHeight || headingLineHeight;
      setCurrentLineHeight(lineHeight || 'default');
    };

    // 초기 상태 업데이트
    updateCurrentStyles();

    // 선택 변경 및 트랜잭션 시 업데이트
    editor.on('selectionUpdate', updateCurrentStyles);
    editor.on('transaction', updateCurrentStyles);

    return () => {
      editor.off('selectionUpdate', updateCurrentStyles);
      editor.off('transaction', updateCurrentStyles);
    };
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleFontFamilyChange = (fontFamily: string) => {
    if (!editor) return;

    if (fontFamily === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  const handleFontSizeChange = (fontSize: string) => {
    if (!editor) return;

    if (fontSize === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(fontSize).run();
    }
  };

  const handleLineHeightChange = (lineHeight: string) => {
    if (!editor) return;

    if (lineHeight === 'default') {
      editor.chain().focus().unsetLineHeight().run();
    } else {
      editor.chain().focus().setLineHeight(lineHeight).run();
    }
  };

  if (!editor) {
    return (
      <div className="border rounded-md p-4 min-h-[400px] animate-pulse bg-muted" />
    );
  }

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {/* 툴바 */}
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
          {/* 실행취소/다시실행 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="실행 취소"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="다시 실행"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 폰트 선택 */}
          <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <Type className="h-3 w-3 mr-1" />
              <SelectValue placeholder="폰트" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.value !== 'default' ? font.value : undefined }}
                >
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 글자 크기 선택 */}
          <Select value={currentFontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="h-8 w-[90px] text-xs">
              <ALargeSmall className="h-3 w-3 mr-1" />
              <SelectValue placeholder="크기" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem
                  key={size.value}
                  value={size.value}
                  style={{ fontSize: size.value !== 'default' ? size.value : undefined }}
                >
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 줄 간격 선택 */}
          <Select value={currentLineHeight} onValueChange={handleLineHeightChange}>
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <WrapText className="h-3 w-3 mr-1" />
              <SelectValue placeholder="줄간격" />
            </SelectTrigger>
            <SelectContent>
              {LINE_HEIGHTS.map((height) => (
                <SelectItem key={height.value} value={height.value}>
                  {height.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 헤딩 */}
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            tooltip="제목 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            tooltip="제목 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            tooltip="제목 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 4 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            tooltip="제목 4"
          >
            <Heading4 className="h-4 w-4" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 텍스트 스타일 */}
          <ToolbarToggle
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            tooltip="굵게"
          >
            <Bold className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            tooltip="기울임"
          >
            <Italic className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            tooltip="밑줄"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            tooltip="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            tooltip="인라인 코드"
          >
            <Code className="h-4 w-4" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 정렬 */}
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('left').run()
            }
            tooltip="왼쪽 정렬"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('center').run()
            }
            tooltip="가운데 정렬"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('right').run()
            }
            tooltip="오른쪽 정렬"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 리스트 */}
          <ToolbarToggle
            pressed={editor.isActive('bulletList')}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            tooltip="글머리 기호"
          >
            <List className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('orderedList')}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            tooltip="번호 매기기"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 블록 요소 */}
          <ToolbarToggle
            pressed={editor.isActive('blockquote')}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            tooltip="인용구"
          >
            <Quote className="h-4 w-4" />
          </ToolbarToggle>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip="구분선"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarToggle
            pressed={editor.isActive('link')}
            onPressedChange={setLink}
            tooltip="링크"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarToggle>
        </div>
      </TooltipProvider>

      {/* 에디터 영역 */}
      <EditorContent editor={editor} className="min-h-[300px]" />

      {/* 에디터 스타일 */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
          padding: 1rem;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror h1 {
          font-size: 1.75em;
          font-weight: 700;
          margin: 1em 0 0.5em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1em 0 0.5em;
        }
        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1em 0 0.5em;
        }
        .ProseMirror h4 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 1em 0 0.5em;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
        }
        .dark .ProseMirror blockquote {
          border-left-color: #4b5563;
          color: #9ca3af;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5em 0;
        }
        .dark .ProseMirror hr {
          border-top-color: #374151;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-size: 0.875em;
        }
        .dark .ProseMirror code {
          background: #374151;
        }
        .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// 툴바 버튼 컴포넌트
function ToolbarButton({
  children,
  onClick,
  disabled,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// 툴바 토글 컴포넌트
function ToolbarToggle({
  children,
  pressed,
  onPressedChange,
  tooltip,
}: {
  children: React.ReactNode;
  pressed: boolean;
  onPressedChange: () => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          className="h-8 w-8 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
