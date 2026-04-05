import type { API } from '@editorjs/editorjs'
import { make } from './editorjsImageToolDom'
import type {
  ImageConfig,
  ImageToolDefaultElement,
} from './editorjsImageToolTypes'

const IconPicture =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="14" height="14" x="5" y="5" stroke="currentColor" stroke-width="2" rx="4"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.13968 15.32L8.69058 11.5661C9.02934 11.2036 9.48873 11 9.96774 11C10.4467 11 10.9061 11.2036 11.2449 11.5661L15.3871 16M13.5806 14.0664L15.0132 12.533C15.3519 12.1705 15.8113 11.9668 16.2903 11.9668C16.7693 11.9668 17.2287 12.1705 17.5675 12.533L18.841 13.9634"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.7778 9.33331H13.7867"/></svg>'

export enum UiState {
  Empty = 'empty',
  Uploading = 'uploading',
  Filled = 'filled',
}

type Nodes = {
  wrapper: HTMLElement
  imageContainer: HTMLElement
  fileButton: HTMLElement
  imageEl?: HTMLElement
  imagePreloader: HTMLElement
  caption: HTMLElement
}

type UiConstructorParams = {
  api: API
  config: ImageConfig
  onSelectFile: () => void
  readOnly: boolean
}

export default class Ui {
  public nodes: Nodes
  private api: API
  private config: ImageConfig
  private onSelectFile: () => void
  private readOnly: boolean
  private defaultElements: ImageToolDefaultElement[]

  constructor({ api, config, onSelectFile, readOnly }: UiConstructorParams) {
    this.api = api
    this.config = config
    this.onSelectFile = onSelectFile
    this.readOnly = readOnly
    this.defaultElements = config.defaultElements ?? [
      'caption',
      'withBorder',
      'stretched',
      'withBackground',
    ]

    this.nodes = {
      wrapper: make('div', [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make('div', [this.CSS.imageContainer]),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make('div', this.CSS.imagePreloader),
      caption: make('div', [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
    }

    this.nodes.caption.dataset.placeholder =
      this.config.captionPlaceholder ?? ''
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader)

    if (!this.readOnly) {
      this.nodes.imageContainer.addEventListener('click', () => {
        if (
          this.nodes.wrapper.classList.contains(`${this.CSS.wrapper}--filled`)
        ) {
          this.onSelectFile()
        }
      })
      this.nodes.imageContainer.style.cursor = 'pointer'
    }

    this.nodes.wrapper.appendChild(this.nodes.imageContainer)

    if (this.defaultElements.includes('caption')) {
      this.nodes.wrapper.appendChild(this.nodes.caption)
    }

    this.nodes.wrapper.appendChild(this.nodes.fileButton)
  }

  public applyTune(tuneName: string, status: boolean): void {
    this.nodes.wrapper.classList.toggle(
      `${this.CSS.wrapper}--${tuneName}`,
      status,
    )
  }

  public render(): HTMLElement {
    this.toggleStatus(UiState.Empty)
    return this.nodes.wrapper
  }

  public showPreloader(src: string): void {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`
    this.toggleStatus(UiState.Uploading)
  }

  public hidePreloader(): void {
    this.nodes.imagePreloader.style.backgroundImage = ''
    this.toggleStatus(UiState.Empty)
  }

  public fillImage(url: string): void {
    const tag = /\.mp4$/.test(url) ? 'VIDEO' : 'IMG'
    const attributes: Record<string, string | boolean> = { src: url }
    let eventName = 'load'

    if (tag === 'VIDEO') {
      attributes.autoplay = true
      attributes.loop = true
      attributes.muted = true
      attributes.playsinline = true
      eventName = 'loadeddata'
    }

    if (this.nodes.imageEl) {
      this.nodes.imageEl.remove()
    }

    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes)
    this.nodes.imageEl.addEventListener(eventName, () => {
      this.toggleStatus(UiState.Filled)
      if (this.nodes.imagePreloader !== undefined) {
        this.nodes.imagePreloader.style.backgroundImage = ''
      }
    })

    this.nodes.imageContainer.appendChild(this.nodes.imageEl)
  }

  public fillCaption(text: string): void {
    if (this.nodes.caption !== undefined) {
      this.nodes.caption.innerHTML = text
    }
  }

  public toggleStatus(status: UiState): void {
    for (const statusType in UiState) {
      if (Object.prototype.hasOwnProperty.call(UiState, statusType)) {
        const state = UiState[statusType as keyof typeof UiState]
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${state}`,
          state === status,
        )
      }
    }
  }

  private get CSS(): Record<string, string> {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,
      wrapper: 'image-tool',
      imageContainer: 'image-tool__image',
      imagePreloader: 'image-tool__image-preloader',
      imageEl: 'image-tool__image-picture',
      caption: 'image-tool__caption',
    }
  }

  private createFileButton(): HTMLElement {
    const button = make('div', [this.CSS.button])
    button.innerHTML =
      this.config.buttonContent ??
      `${IconPicture} ${this.api.i18n.t('Select an Image')}`
    button.addEventListener('click', () => {
      this.onSelectFile()
    })
    return button
  }
}
