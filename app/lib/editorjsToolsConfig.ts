import { BLOCK_BACKGROUND_TUNE_NAME } from './editorjsBlockBackground'
import EditorjsBlockBackgroundTune from './editorjsBlockBackgroundTune'
import BigEmojiTool from './bigEmojiTool'
import { editorMessages } from './editorjsMessages'
import InlineHashtagTool from './inlineHashtagTool'
import InlineHighlightTool from './inlineHighlightTool'
import NoteTitleTool from './noteTitleTool'
import SimpleQuoteTool from './simpleQuoteTool'

type EditorjsTool = new (...args: never[]) => unknown

type EditorImageUploadResponse = {
  success: number
  file: { url: string }
}

type CreateEditorToolsConfigArgs = {
  Code: EditorjsTool
  Delimiter: EditorjsTool
  Header: EditorjsTool
  ImageTool: EditorjsTool
  InlineCode: EditorjsTool
  List: EditorjsTool
  Table: EditorjsTool
  translate: (key: string) => string
  uploadByFile: (file: File) => Promise<EditorImageUploadResponse>
}

export const inlineToolbarTools = [
  'link',
  'bold',
  'italic',
  'inlineCode',
  'inlineHighlight',
]

export const blockTuneTools = [BLOCK_BACKGROUND_TUNE_NAME]

export const editorI18n = {
  messages: editorMessages,
}

export function createEditorToolsConfig({
  Code,
  Delimiter,
  Header,
  ImageTool,
  InlineCode,
  List,
  Table,
  translate,
  uploadByFile,
}: CreateEditorToolsConfigArgs): Record<string, unknown> {
  return {
    [BLOCK_BACKGROUND_TUNE_NAME]: {
      class: EditorjsBlockBackgroundTune,
    },
    noteTitle: {
      class: NoteTitleTool,
      inlineToolbar: false,
      config: {
        ariaLabel: translate('noteTitle.ariaLabel'),
        placeholder: translate('noteTitle.placeholder'),
      },
    },
    paragraph: {
      inlineToolbar: inlineToolbarTools,
      tunes: blockTuneTools,
      config: {
        preserveBlank: true,
      },
    },
    header: {
      class: Header,
      inlineToolbar: inlineToolbarTools,
      tunes: blockTuneTools,
      toolbox: [
        {
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" rtrvr-ls="0~hs"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M19 17V10.2135C19 10.1287 18.9011 10.0824 18.836 10.1367L16 12.5"></path></svg>',
          title: 'Heading 1',
          data: {
            level: 1,
          },
        },
        {
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 11C16 10 19 9.5 19 12C19 13.9771 16.0684 13.9997 16.0012 16.8981C15.9999 16.9533 16.0448 17 16.1 17L19.3 17"></path></svg>',
          title: 'Heading 2',
          data: {
            level: 2,
          },
        },
        {
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 7L6 12M6 17L6 12M6 12L12 12M12 7V12M12 17L12 12"></path><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 11C16 10.5 16.8323 10 17.6 10C18.3677 10 19.5 10.311 19.5 11.5C19.5 12.5315 18.7474 12.9022 18.548 12.9823C18.5378 12.9864 18.5395 13.0047 18.5503 13.0063C18.8115 13.0456 20 13.3065 20 14.8C20 16 19.5 17 17.8 17C17.8 17 16 17 16 16.3"></path></svg>',
          title: 'Heading 3',
          data: {
            level: 3,
          },
        },
      ],
      config: {
        placeholder: 'Heading',
        levels: [1, 2, 3],
        defaultLevel: 2,
      },
    },
    list: {
      class: List,
      inlineToolbar: inlineToolbarTools,
      tunes: blockTuneTools,
    },
    code: {
      class: Code,
      tunes: blockTuneTools,
    },
    delimiter: {
      class: Delimiter,
      tunes: blockTuneTools,
    },
    inlineCode: {
      class: InlineCode,
    },
    bigEmoji: {
      class: BigEmojiTool,
    },
    inlineHighlight: {
      class: InlineHighlightTool,
    },
    inlineHashtag: {
      class: InlineHashtagTool,
    },
    simpleQuote: {
      class: SimpleQuoteTool,
      inlineToolbar: inlineToolbarTools,
      tunes: blockTuneTools,
    },
    table: {
      class: Table,
      inlineToolbar: inlineToolbarTools,
      tunes: blockTuneTools,
    },
    image: {
      class: ImageTool,
      tunes: blockTuneTools,
      config: {
        defaultElements: ['stretched'],
        uploader: {
          uploadByFile,
        },
      },
    },
  }
}
