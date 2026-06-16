/** @format */

import { handleFormSubmit } from "./form-submit.js"
import { isValidArPhone, normalizePhone } from "./phone-utils.js"

export function initFormValidation() {
  const form = document.querySelector("#register-form")

  if (!form) return

  const phone = form.elements.phone
  const email = form.elements.email
  const password = form.elements.password
  const isAdult = form.elements.isAdult
  const serverError = form.querySelector("#register-form-error")

  let hasAttemptedSubmit = false

  const fieldInputs = [phone, email, password]

  const setFieldErrorVisibility = (input, isValid, shouldShow = false) => {
    const field = input?.closest(".field")
    const error = field?.querySelector(".field__error")

    if (!field) return

    field.classList.toggle("field--invalid", shouldShow && !isValid)

    if (error) {
      error.classList.toggle("shown", shouldShow && !isValid)
    }
  }

  const setCheckboxErrorVisibility = (input, isValid, shouldShow = false) => {
    const field = input?.closest(".check")
    const error = field?.querySelector(".field__error")

    if (!field) return

    field.classList.toggle("field--invalid", shouldShow && !isValid)

    if (error) {
      error.classList.toggle("shown", shouldShow && !isValid)
    }
  }

  const validateInput = (input, shouldShow = false) => {
    let isValid = false

    if (input === phone) {
      isValid = isValidArPhone(phone.value)
    }

    if (input === email) {
      const value = email.value.trim()
      isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }

    if (input === password) {
      isValid = password.value.trim().length >= 8
    }

    setFieldErrorVisibility(input, isValid, shouldShow)
    return isValid
  }

  const validateCheckbox = (shouldShow = false) => {
    const isValid = Boolean(isAdult?.checked)
    setCheckboxErrorVisibility(isAdult, isValid, shouldShow)
    return isValid
  }

  const validateForm = (shouldShow = false) => {
    const fieldsValid = fieldInputs
      .map((input) => validateInput(input, shouldShow))
      .every(Boolean)
    const checkboxValid = validateCheckbox(shouldShow)
    return fieldsValid && checkboxValid
  }

  fieldInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (serverError) {
        serverError.hidden = true
        serverError.textContent = ""
      }
      validateForm(hasAttemptedSubmit)
    })

    input.addEventListener("blur", () => {
      validateForm(hasAttemptedSubmit)
    })
  })

  if (isAdult) {
    isAdult.addEventListener("change", () => {
      validateForm(hasAttemptedSubmit)
    })
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    hasAttemptedSubmit = true

    const isFormValid = validateForm(true)
    if (!isFormValid) return

    if (phone) {
      phone.value = normalizePhone(phone.value)
    }

    await handleFormSubmit(form)
  })

  validateForm()
}
