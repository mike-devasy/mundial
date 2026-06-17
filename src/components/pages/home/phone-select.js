/** @format */

import {
  AR_COUNTRY_CODE,
  AR_LOCAL_PHONE_LENGTH,
  getPhoneLocalDigits,
} from "./phone-utils.js"

const PHONE_PREFIX = `+${AR_COUNTRY_CODE}`
const PHONE_MASK_START = `${PHONE_PREFIX} (`

const formatArPhone = (value = "") => {
  const digits = getPhoneLocalDigits(value).slice(0, AR_LOCAL_PHONE_LENGTH)

  if (!digits.length) {
    return PHONE_PREFIX
  }

  const areaCode = digits.slice(0, 3)
  const firstPart = digits.slice(3, 6)
  const secondPart = digits.slice(6, 10)

  let formatted = `${PHONE_MASK_START}${areaCode}`

  if (areaCode.length === 3) {
    formatted += ")"
  }

  if (firstPart.length) {
    formatted += ` ${firstPart}`
  }

  if (secondPart.length) {
    formatted += ` - ${secondPart}`
  }

  return formatted
}

export function initPhoneMask() {
  const phoneInput = document.querySelector('input[name="phone"]')

  if (!phoneInput || phoneInput.dataset.phoneMaskInitialized === "true") {
    return
  }

  phoneInput.dataset.phoneMaskInitialized = "true"
  phoneInput.value = PHONE_PREFIX
  phoneInput.placeholder = ""
  phoneInput.inputMode = "numeric"
  phoneInput.autocomplete = "tel"

  const prefixLength = PHONE_PREFIX.length

  const moveCaretToEnd = () => {
    window.requestAnimationFrame(() => {
      const position = phoneInput.value.length
      phoneInput.setSelectionRange(position, position)
    })
  }

  const moveCaretAfterPrefix = () => {
    window.requestAnimationFrame(() => {
      const position = Math.max(prefixLength, phoneInput.value.length)
      phoneInput.setSelectionRange(position, position)
    })
  }

  phoneInput.addEventListener("focus", moveCaretAfterPrefix)

  phoneInput.addEventListener("click", () => {
    const selectionStart = phoneInput.selectionStart ?? 0

    if (selectionStart < prefixLength) {
      moveCaretAfterPrefix()
    }
  })

  phoneInput.addEventListener("input", () => {
    const localDigits = getPhoneLocalDigits(phoneInput.value)

    phoneInput.value = formatArPhone(localDigits)

    if (localDigits.length) {
      moveCaretToEnd()
    } else {
      moveCaretAfterPrefix()
    }
  })

  phoneInput.addEventListener("keydown", (event) => {
    const selectionStart = phoneInput.selectionStart ?? prefixLength
    const selectionEnd = phoneInput.selectionEnd ?? selectionStart
    const localDigits = getPhoneLocalDigits(phoneInput.value)

    const isDeletingPrefix =
      (event.key === "Backspace" &&
        selectionStart <= prefixLength &&
        selectionEnd <= prefixLength) ||
      (event.key === "Delete" && selectionStart < prefixLength)

    if (isDeletingPrefix) {
      event.preventDefault()
      moveCaretAfterPrefix()
      return
    }

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      localDigits.length <= 1
    ) {
      event.preventDefault()
      phoneInput.value = PHONE_PREFIX
      phoneInput.dispatchEvent(new Event("input", { bubbles: true }))
      moveCaretAfterPrefix()
    }
  })
}
