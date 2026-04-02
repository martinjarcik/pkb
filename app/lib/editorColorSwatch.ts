export function darkenHexColor(color: string): string {
  const match = color.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i)

  if (!match) {
    return color
  }

  const hex = match[1]!
  const channels = [0, 2, 4].map((offset) =>
    Math.round(parseInt(hex.slice(offset, offset + 2), 16) * 0.82)
      .toString(16)
      .padStart(2, '0'),
  )

  return `#${channels.join('')}`
}

export function backgroundSwatchIcon(background: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="1" y="1" width="18" height="18" rx="2" fill="${background}" stroke="${darkenHexColor(background)}" stroke-width="1.25"/></svg>`
}
