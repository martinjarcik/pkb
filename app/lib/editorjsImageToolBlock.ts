/**
 * Vendored @editorjs/image v2.10.3 (TypeScript source from master) with:
 *  - PR #96 defaultElements: control which built-in UI pieces are enabled
 *  - Inline local-asset patch: force filled state for asset:// / blob: URLs
 *
 * @see https://github.com/editor-js/image
 * @see https://github.com/editor-js/image/pull/96
 * @license MIT
 */

import type {
  ToolboxConfig,
  PasteConfig,
  BlockToolConstructorOptions,
  BlockTool,
  BlockAPI,
  PasteEvent,
  PatternPasteEventDetail,
  FilePasteEventDetail,
  API,
} from '@editorjs/editorjs'
import type { TunesMenuConfig } from '@editorjs/editorjs/types/tools/tool-settings'

import Ui from './editorjsImageToolUi'
import Uploader from './editorjsImageToolUploader'
import type {
  ActionConfig,
  UploadResponseFormat,
  ImageToolData,
  ImageConfig,
  HTMLPasteEventDetailExtended,
  ImageSetterParam,
  FeaturesConfig,
  ImageToolDefaultElement,
} from './editorjsImageToolTypes'
import { ALL_DEFAULT_ELEMENTS } from './editorjsImageToolTypes'
import { isLocalEditorImageUrl } from './editorjsImageToolLocalUrl'

const IconAddBorder =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.9919 9.5H19.0015"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M14.5 5H14.5096"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M14.625 5H15C17.2091 5 19 6.79086 19 9V9.375"/><path stroke="currentColor" stroke-width="2" d="M9.375 5L9 5C6.79086 5 5 6.79086 5 9V9.375"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.3725 5H9.38207"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 9.5H5.00957"/><path stroke="currentColor" stroke-width="2" d="M9.375 19H9C6.79086 19 5 17.2091 5 15V14.625"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.3725 19H9.38207"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 14.55H5.00957"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 13V16M16 19V16M19 16H16M16 16H13"/></svg>'
const IconStretch =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9L20 12L17 15"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 12H20"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 9L4 12L7 15"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12H10"/></svg>'
const IconAddBackground =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19V19C9.13623 19 8.20435 19 7.46927 18.6955C6.48915 18.2895 5.71046 17.5108 5.30448 16.5307C5 15.7956 5 14.8638 5 13V12C5 9.19108 5 7.78661 5.67412 6.77772C5.96596 6.34096 6.34096 5.96596 6.77772 5.67412C7.78661 5 9.19108 5 12 5H13.5C14.8956 5 15.5933 5 16.1611 5.17224C17.4395 5.56004 18.44 6.56046 18.8278 7.83886C19 8.40666 19 9.10444 19 10.5V10.5"/><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M16 13V16M16 19V16M19 16H16M16 16H13"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6.5 17.5L17.5 6.5"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.9919 10.5H19.0015"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.9919 19H11.0015"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13L13 5"/></svg>'
const IconPicture =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="14" height="14" x="5" y="5" stroke="currentColor" stroke-width="2" rx="4"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.13968 15.32L8.69058 11.5661C9.02934 11.2036 9.48873 11 9.96774 11C10.4467 11 10.9061 11.2036 11.2449 11.5661L15.3871 16M13.5806 14.0664L15.0132 12.533C15.3519 12.1705 15.8113 11.9668 16.2903 11.9668C16.7693 11.9668 17.2287 12.1705 17.5675 12.533L18.841 13.9634"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.7778 9.33331H13.7867"/></svg>'
const IconText =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M8 9V7.2C8 7.08954 8.08954 7 8.2 7L12 7M16 9V7.2C16 7.08954 15.9105 7 15.8 7L12 7M12 7L12 17M12 17H10M12 17H14"/></svg>'

type ImageToolConstructorOptions = BlockToolConstructorOptions<
  ImageToolData,
  ImageConfig
>

export default class ImageTool implements BlockTool {
  private api: API
  private block: BlockAPI
  private config: ImageConfig
  private uploader: Uploader
  public ui: Ui
  private _data: ImageToolData
  private isCaptionEnabled: boolean | null = null
  private defaultElements: ImageToolDefaultElement[]

  constructor({
    data,
    config: rawConfig,
    api,
    readOnly,
    block,
  }: ImageToolConstructorOptions) {
    this.api = api
    this.block = block

    const cfg = rawConfig ?? ({} as Partial<ImageConfig>)

    this.config = {
      endpoints: cfg.endpoints ?? {},
      additionalRequestData: cfg.additionalRequestData,
      additionalRequestHeaders: cfg.additionalRequestHeaders,
      field: cfg.field,
      types: cfg.types,
      captionPlaceholder: this.api.i18n.t(cfg.captionPlaceholder ?? 'Caption'),
      buttonContent: cfg.buttonContent,
      uploader: cfg.uploader,
      actions: cfg.actions,
      features: cfg.features || {},
      defaultElements: cfg.defaultElements,
    }

    this.defaultElements = this.config.defaultElements ?? ALL_DEFAULT_ELEMENTS

    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response: UploadResponseFormat) => this.onUpload(response),
      onError: (error: string) => this.uploadingFailed(error),
    })

    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src: string) => {
            this.ui.showPreloader(src)
          },
        })
      },
      readOnly: readOnly ?? false,
    })

    this._data = {
      caption: '',
      withBorder: false,
      withBackground: false,
      stretched: false,
      file: { url: '' },
    }
    this.data = data
  }

  public static get isReadOnlySupported(): boolean {
    return true
  }

  public static get toolbox(): ToolboxConfig {
    return { icon: IconPicture, title: 'Image' }
  }

  public static get tunes(): Array<ActionConfig> {
    return [
      {
        name: 'withBorder',
        icon: IconAddBorder,
        title: 'With border',
        toggle: true,
      },
      {
        name: 'stretched',
        icon: IconStretch,
        title: 'Stretch image',
        toggle: true,
      },
      {
        name: 'withBackground',
        icon: IconAddBackground,
        title: 'With background',
        toggle: true,
      },
    ]
  }

  public render(): HTMLDivElement {
    if (this.defaultElements.includes('caption')) {
      if (
        this.config.features?.caption === true ||
        this.config.features?.caption === undefined ||
        (this.config.features?.caption === 'optional' && this.data.caption)
      ) {
        this.isCaptionEnabled = true
        this.ui.applyTune('caption', true)
      }
    }

    const result = this.ui.render() as HTMLDivElement

    const url = this._data.file?.url
    if (typeof url === 'string' && isLocalEditorImageUrl(url)) {
      this.forceFilledStatus()
    }

    return result
  }

  public validate(savedData: ImageToolData): boolean {
    return !!savedData.file.url
  }

  public save(): ImageToolData {
    this._data.caption = this.ui.nodes.caption?.innerHTML ?? ''
    return this.data
  }

  public renderSettings(): TunesMenuConfig {
    const tunes = ImageTool.tunes.concat(this.config.actions || [])
    const featureTuneMap: Record<string, string> = {
      border: 'withBorder',
      background: 'withBackground',
      stretch: 'stretched',
      caption: 'caption',
    }

    if (
      this.defaultElements.includes('caption') &&
      this.config.features?.caption === 'optional'
    ) {
      tunes.push({
        name: 'caption',
        icon: IconText,
        title: 'With caption',
        toggle: true,
      })
    }

    const availableTunes = tunes.filter((tune) => {
      if (
        !this.defaultElements.includes(tune.name as ImageToolDefaultElement)
      ) {
        return false
      }

      const featureKey = Object.keys(featureTuneMap).find(
        (key) => featureTuneMap[key] === tune.name,
      )

      if (featureKey === 'caption') {
        return this.config.features?.caption !== false
      }

      return (
        featureKey == null ||
        this.config.features?.[featureKey as keyof FeaturesConfig] !== false
      )
    })

    const isActive = (tune: ActionConfig): boolean => {
      let currentState = this.data[tune.name] as boolean
      if (tune.name === 'caption') {
        currentState = this.isCaptionEnabled ?? currentState
      }
      return currentState
    }

    return availableTunes.map((tune) => ({
      icon: tune.icon,
      label: this.api.i18n.t(tune.title),
      name: tune.name,
      toggle: tune.toggle,
      isActive: isActive(tune),
      onActivate: () => {
        if (typeof tune.action === 'function') {
          tune.action(tune.name)
          return
        }
        let newState = !isActive(tune)

        if (tune.name === 'caption') {
          this.isCaptionEnabled = !(this.isCaptionEnabled ?? false)
          newState = this.isCaptionEnabled
        }

        this.tuneToggled(tune.name, newState)
      },
    }))
  }

  public appendCallback(): void {
    this.ui.nodes.fileButton.click()
  }

  public static get pasteConfig(): PasteConfig {
    return {
      tags: [{ img: { src: true } }],
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|svg|webp)(\?[a-z0-9=]*)?$/i,
      },
      files: { mimeTypes: ['image/*'] },
    }
  }

  public async onPaste(event: PasteEvent): Promise<void> {
    switch (event.type) {
      case 'tag': {
        const image = (event.detail as HTMLPasteEventDetailExtended).data
        if (/^blob:/.test(image.src)) {
          const response = await fetch(image.src)
          const file = await response.blob()
          this.uploadFile(file)
          break
        }
        this.uploadUrl(image.src)
        break
      }
      case 'pattern': {
        const url = (event.detail as PatternPasteEventDetail).data
        this.uploadUrl(url)
        break
      }
      case 'file': {
        const file = (event.detail as FilePasteEventDetail).file
        this.uploadFile(file)
        break
      }
    }
  }

  private set data(data: ImageToolData) {
    this.image = data.file
    this._data.caption = data.caption || ''
    this.ui.fillCaption(this._data.caption)

    ImageTool.tunes
      .filter((t) =>
        this.defaultElements.includes(t.name as ImageToolDefaultElement),
      )
      .forEach(({ name: tune }) => {
        const value =
          typeof data[tune] !== 'undefined'
            ? data[tune] === true || data[tune] === 'true'
            : false
        this.setTune(tune, value)
      })

    if (data.caption) {
      this.setTune('caption', true)
    } else if (this.config.features?.caption === true) {
      this.setTune('caption', true)
    }
  }

  private get data(): ImageToolData {
    return this._data
  }

  private set image(file: ImageSetterParam | undefined) {
    this._data.file = file || { url: '' }
    if (file && file.url) {
      this.ui.fillImage(file.url)

      if (isLocalEditorImageUrl(file.url)) {
        this.forceFilledStatus()
      }
    }
  }

  private forceFilledStatus(): void {
    queueMicrotask(() => {
      this.ui.toggleStatus?.('filled' as never)

      if (this.ui.nodes?.imagePreloader) {
        this.ui.nodes.imagePreloader.style.backgroundImage = ''
      }
    })
  }

  private onUpload(response: UploadResponseFormat): void {
    if (response.success && Boolean(response.file)) {
      this.image = response.file
    } else {
      this.uploadingFailed('incorrect response: ' + JSON.stringify(response))
    }
  }

  private uploadingFailed(errorText: string): void {
    console.log('Image Tool: uploading failed because of', errorText)
    this.api.notifier.show({
      message: this.api.i18n.t("Couldn't upload image. Please try another."),
      style: 'error',
    })
    this.ui.hidePreloader()
  }

  private tuneToggled(tuneName: string, state: boolean): void {
    if (tuneName === 'caption') {
      this.ui.applyTune(tuneName, state)
      if (state === false) {
        this._data.caption = ''
        this.ui.fillCaption('')
      }
    } else {
      this.setTune(tuneName, state)
    }
  }

  private setTune(tuneName: string, value: boolean): void {
    ;(this._data[tuneName] as boolean) = value
    this.ui.applyTune(tuneName, value)

    if (tuneName === 'stretched') {
      Promise.resolve()
        .then(() => {
          this.block.stretched = value
        })
        .catch((err) => {
          console.error(err)
        })
    }
  }

  private uploadFile(file: Blob): void {
    this.uploader.uploadByFile(file, {
      onPreview: (src: string) => {
        this.ui.showPreloader(src)
      },
    })
  }

  private uploadUrl(url: string): void {
    this.ui.showPreloader(url)
    this.uploader.uploadByUrl(url)
  }
}
