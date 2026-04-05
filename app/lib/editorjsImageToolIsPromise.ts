import type { UploadResponseFormat } from './editorjsImageToolTypes'

export default function isPromise(
  object: unknown,
): object is Promise<UploadResponseFormat> {
  return (
    object !== undefined &&
    object !== null &&
    typeof (object as Promise<unknown>).then === 'function'
  )
}
