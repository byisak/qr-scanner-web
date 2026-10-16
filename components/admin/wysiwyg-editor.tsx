'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import { Skeleton } from '@/components/ui/skeleton';
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

// lineHeight 속성을 가진 커스텀 Paragraph
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) {
            return {};
          }
          return {
            style: `line-height: ${attributes.lineHeight}`,
          };
        },
      },
    };
  },
});

// lineHeight 속성을 가진 커스텀 Heading
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      lineHeight: {
        default: null,
        parseHTML: (element) => element.style.lineHeight || null,
        renderHTML: (attributes) => {
          if (!attributes.lineHeight) {
            return {};
          }
          return {
            style: `line-height: ${attributes.lineHeight}`,
          };
        },
      },
    };
  },
});

// 커스텀 LineHeight Extension (명령어만 제공)
const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
    };
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                lineHeight,
              });
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
        },
      unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                lineHeight: null,
              });
            }
          });

          if (dispatch) {
            dispatch(tr);
          }

          return true;
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

// 'default' 항목의 이름은 화면에서 번역해서 넣는다
const FONT_FAMILIES = [
  { value: 'default', label: '' },
  { value: 'Pretendard', label: 'Pretendard' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Noto Sans KR', label: 'Noto Sans KR' },
];

const FONT_SIZES = [
  { value: 'default', label: '' },
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
  { value: 'default', label: '' },
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
  placeholder,
  className = '',
}: WysiwygEditorProps) {
  const t = useTranslations('admin.editor');
  // 현재 선택된 스타일 상태 추적
  const [currentFontFamily, setCurrentFontFamily] = useState('default');
  const [currentFontSize, setCurrentFontSize] = useState('default');
  const [currentLineHeight, setCurrentLineHeight] = useState('default');

  const editor = useEditor({
    // Next.js 에서 서버 렌더와 어긋나지 않도록 브라우저에서만 그린다 (그 전에는 스켈레톤)
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // 커스텀 Paragraph/Heading 사용을 위해 비활성화
        paragraph: false,
        heading: false,
      }),
      // lineHeight 속성이 포함된 커스텀 Paragraph/Heading
      CustomParagraph,
      CustomHeading.configure({
        levels: [1, 2, 3, 4],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder ?? t('placeholder'),
      }),
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
    ],
    content,
    editorProps: {
      attributes: {
        // 본문은 그래파이트 prose (공개 약관 페이지와 같은 모양)
        class: 'prose max-w-none type-body focus:outline-none min-h-[300px] p-4',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('contentLabel'),
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
    const url = window.prompt(t('linkPrompt'), previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, t]);

  const handleFontFamilyChange = (fontFamily: string) => {
    if (!editor) return;

    if (fontFamily === 'default') {
      editor.chain().focus(undefined, { scrollIntoView: false }).unsetFontFamily().run();
    } else {
      editor.chain().focus(undefined, { scrollIntoView: false }).setFontFamily(fontFamily).run();
    }
  };

  const handleFontSizeChange = (fontSize: string) => {
    if (!editor) return;

    if (fontSize === 'default') {
      editor.chain().focus(undefined, { scrollIntoView: false }).unsetFontSize().run();
    } else {
      editor.chain().focus(undefined, { scrollIntoView: false }).setFontSize(fontSize).run();
    }
  };

  const handleLineHeightChange = (lineHeight: string) => {
    if (!editor) return;

    if (lineHeight === 'default') {
      editor.chain().focus(undefined, { scrollIntoView: false }).unsetLineHeight().run();
    } else {
      editor.chain().focus(undefined, { scrollIntoView: false }).setLineHeight(lineHeight).run();
    }
  };

  if (!editor) {
    return (
      <Skeleton className="min-h-[400px] rounded-field" />
    );
  }

  return (
    <div className={`overflow-hidden rounded-field border bg-card ${className}`}>
      {/* 툴바 */}
      <TooltipProvider delayDuration={300}>
        <div role="toolbar" aria-label={t('toolbar')} className="flex flex-wrap items-center gap-1 border-b bg-muted p-2">
          {/* 실행취소/다시실행 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip={t('undo')}
          >
            <Undo aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip={t('redo')}
          >
            <Redo aria-hidden="true" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 폰트 선택 */}
          <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="h-[34px] w-[150px] rounded-full px-3 text-13" aria-label={t('font')}>
              <Type className="size-3.5" aria-hidden="true" />
              <SelectValue placeholder={t('font')} />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.value !== 'default' ? font.value : undefined }}
                >
                  {font.value === 'default' ? t('fontDefault') : font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 글자 크기 선택 */}
          <Select value={currentFontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="h-[34px] w-[120px] rounded-full px-3 text-13" aria-label={t('size')}>
              <ALargeSmall className="size-3.5" aria-hidden="true" />
              <SelectValue placeholder={t('size')} />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem
                  key={size.value}
                  value={size.value}
                  style={{ fontSize: size.value !== 'default' ? size.value : undefined }}
                >
                  {size.value === 'default' ? t('sizeDefault') : size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 줄 간격 선택 */}
          <Select value={currentLineHeight} onValueChange={handleLineHeightChange}>
            <SelectTrigger className="h-[34px] w-[96px] rounded-full px-3 text-13" aria-label={t('lineHeight')}>
              <WrapText className="size-3.5" aria-hidden="true" />
              <SelectValue placeholder={t('lineHeight')} />
            </SelectTrigger>
            <SelectContent>
              {LINE_HEIGHTS.map((height) => (
                <SelectItem key={height.value} value={height.value}>
                  {height.value === 'default' ? t('lineHeightDefault') : height.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 헤딩 */}
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            tooltip={t('heading', { level: 1 })}
          >
            <Heading1 aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            tooltip={t('heading', { level: 2 })}
          >
            <Heading2 aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            tooltip={t('heading', { level: 3 })}
          >
            <Heading3 aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('heading', { level: 4 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            tooltip={t('heading', { level: 4 })}
          >
            <Heading4 aria-hidden="true" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 텍스트 스타일 */}
          <ToolbarToggle
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            tooltip={t('bold')}
          >
            <Bold aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            tooltip={t('italic')}
          >
            <Italic aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            tooltip={t('underline')}
          >
            <UnderlineIcon aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            tooltip={t('strike')}
          >
            <Strikethrough aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            tooltip={t('code')}
          >
            <Code aria-hidden="true" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 정렬 */}
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('left').run()
            }
            tooltip={t('alignLeft')}
          >
            <AlignLeft aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('center').run()
            }
            tooltip={t('alignCenter')}
          >
            <AlignCenter aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign('right').run()
            }
            tooltip={t('alignRight')}
          >
            <AlignRight aria-hidden="true" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 리스트 */}
          <ToolbarToggle
            pressed={editor.isActive('bulletList')}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            tooltip={t('bulletList')}
          >
            <List aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarToggle
            pressed={editor.isActive('orderedList')}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            tooltip={t('orderedList')}
          >
            <ListOrdered aria-hidden="true" />
          </ToolbarToggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* 블록 요소 */}
          <ToolbarToggle
            pressed={editor.isActive('blockquote')}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            tooltip={t('blockquote')}
          >
            <Quote aria-hidden="true" />
          </ToolbarToggle>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip={t('hr')}
          >
            <Minus aria-hidden="true" />
          </ToolbarButton>
          <ToolbarToggle
            pressed={editor.isActive('link')}
            onPressedChange={setLink}
            tooltip={t('link')}
          >
            <LinkIcon aria-hidden="true" />
          </ToolbarToggle>
        </div>
      </TooltipProvider>

      {/* 에디터 영역 - 스크롤 가능 */}
      <div className="max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} className="min-h-[300px]" />
      </div>

      {/* 편집 영역: 글 모양은 prose(그래파이트 토큰)가 맡고, 여기서는 빈 칸 안내만 */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--faint);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror p:empty {
          min-height: 1em;
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
          size="icon-sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={tooltip}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
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
          aria-label={tooltip}
          className="px-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
