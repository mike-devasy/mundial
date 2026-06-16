/** @format */

import "./home.scss"

// Form connection=================================
import { initPasswordToggle } from "./password-toggle.js"
import { initFormValidation } from "./form-validation.js"
import { initPhoneMask } from "./phone-select.js"

 

const initPopupFlow = () => {
  const flow = document.querySelector("[data-popup-flow]")

  if (!flow || flow.dataset.popupFlowInitialized === "true") return

  const bonus = flow.querySelector("[data-popup-bonus]")
  const form = flow.querySelector("[data-popup-form]")
  const bonusButton = flow.querySelector("[data-popup-bonus-button]")

  if (!bonus || !form || !bonusButton) return

  flow.dataset.popupFlowInitialized = "true"

  const setStep = (step) => {
    const isFormStep = step === "form"

    flow.dataset.step = step
    bonus.hidden = isFormStep
    form.hidden = !isFormStep

    if (isFormStep) {
      const firstField = form.querySelector("input:not([type='hidden']), button, a")
      firstField?.focus({ preventScroll: true })
    }
  }

  bonusButton.addEventListener("click", () => setStep("form"))

  document.addEventListener("afterPopupOpen", (event) => {
    if (event.detail?.popup?.targetOpen?.selector === "popup") {
      setStep("bonus")
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  initPopupFlow()
  initPasswordToggle()
  initFormValidation()
  initPhoneMask()
})
