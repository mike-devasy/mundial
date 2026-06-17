/** @format */

import "./home.scss"

// Form connection=================================
import { initPasswordToggle } from "./password-toggle.js"
import { initFormValidation } from "./form-validation.js"
import { initPhoneMask } from "./phone-select.js"
import { matches } from "./matches-data.js"

const LIVE_DURATION_MINUTES = 120
const STATUS_REFRESH_INTERVAL = 60 * 60 * 1000
const MANUAL_PAUSE_DURATION = 12 * 1000
const LIVE_CENTER_INTERVAL = 5 * 1000
const FORCED_PAST_LAST_DATE = "2026-06-16"

const formatMatchDate = (date) => {
  const [, month, day] = date.split("-")
  return `${day}.${month}`
}

const clampIndex = (index, maxIndex) => Math.max(0, Math.min(index, maxIndex))

const getMatchStatus = (match, now = new Date()) => {
  if (match.date <= FORCED_PAST_LAST_DATE) return "past"

  const kickoffTime = new Date(match.kickoff).getTime()
  const liveEndsAt = kickoffTime + LIVE_DURATION_MINUTES * 60 * 1000
  const currentTime = now.getTime()

  if (currentTime >= kickoffTime && currentTime < liveEndsAt) return "live"
  if (currentTime >= liveEndsAt) return "past"

  return "upcoming"
}

const createMatchSlide = (match, index) => {
  const slide = document.createElement("article")
  const dateLabel = formatMatchDate(match.date)
  const matchLabel = `${dateLabel}: ${match.home.name} vs ${match.away.name}`

  slide.className = "match-slider__slide"
  slide.dataset.matchIndex = String(index)
  slide.dataset.matchId = match.id
  slide.setAttribute("aria-label", matchLabel)

  const image = document.createElement("img")
  image.className = "match-slider__image"
  image.src = match.image
  image.alt = matchLabel
  image.loading = index > 4 ? "lazy" : "eager"

  const meta = document.createElement("span")
  meta.className = "match-slider__meta"
  meta.textContent = matchLabel

  slide.append(image, meta)

  return slide
}

const initMatchSlider = () => {
  const track = document.querySelector("[data-match-slider-track]")
  const viewport = document.querySelector("[data-match-slider-viewport]")
  const prevButton = document.querySelector("[data-match-slider-prev]")
  const nextButton = document.querySelector("[data-match-slider-next]")

  if (!track || !viewport || track.dataset.matchSliderInitialized === "true") return

  const slides = matches.map(createMatchSlide)
  const maxIndex = slides.length - 1
  let activeIndex = Math.min(2, maxIndex)
  let statuses = []
  let statusIntervalId = null
  let autoCenterTimerId = null
  let pauseTimerId = null
  let resizeTimerId = null
  let liveCycleIndex = 0
  let highlightedIndex = -1
  let isAutoPaused = false
  let isProgrammaticScroll = false

  track.replaceChildren(...slides)
  track.dataset.matchSliderInitialized = "true"

  const getLiveIndexes = () => statuses.reduce((indexes, status, index) => {
    if (status === "live") indexes.push(index)
    return indexes
  }, [])

  const getPreferredIndex = () => {
    const liveIndexes = getLiveIndexes()

    if (liveIndexes.length) return highlightedIndex >= 0 ? highlightedIndex : liveIndexes[liveCycleIndex % liveIndexes.length]

    const nextUpcomingIndex = statuses.findIndex((status) => status === "upcoming")

    if (nextUpcomingIndex >= 0) return nextUpcomingIndex

    return maxIndex
  }

  const centerSlide = (index, behavior = "smooth") => {
    const slide = slides[index]

    if (!slide) return

    const nextScrollLeft = slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2

    isProgrammaticScroll = true
    viewport.scrollTo({
      left: nextScrollLeft,
      behavior,
    })

    window.setTimeout(() => {
      isProgrammaticScroll = false
    }, 900)
  }

  const clearAutoCenterTimer = () => {
    if (!autoCenterTimerId) return

    window.clearTimeout(autoCenterTimerId)
    autoCenterTimerId = null
  }

  const updateControls = () => {
    if (prevButton) prevButton.disabled = activeIndex === 0
    if (nextButton) nextButton.disabled = activeIndex === maxIndex
  }

  const setHighlightedSlide = (nextIndex) => {
    highlightedIndex = statuses[nextIndex] === "live" ? nextIndex : -1

    slides.forEach((slide, index) => {
      slide.classList.toggle("is-highlighted", index === highlightedIndex)
    })
  }

  const setActiveSlide = (nextIndex, { shouldCenter = true, behavior = "smooth", pauseAuto = false } = {}) => {
    activeIndex = clampIndex(nextIndex, maxIndex)

    updateControls()

    if (pauseAuto) pauseAutoCentering()
    if (shouldCenter) centerSlide(activeIndex, behavior)
  }

  const applyStatuses = () => {
    statuses = matches.map((match) => getMatchStatus(match))

    slides.forEach((slide, index) => {
      const status = statuses[index]

      slide.dataset.matchStatus = status
      slide.classList.toggle("is-past", status === "past")
      slide.classList.toggle("is-live", status === "live")
      slide.classList.toggle("is-upcoming", status === "upcoming")
    })

    if (highlightedIndex >= 0 && statuses[highlightedIndex] !== "live") {
      setHighlightedSlide(-1)
    }
  }

  const scheduleAutoCentering = () => {
    clearAutoCenterTimer()

    if (isAutoPaused) return

    const liveIndexes = getLiveIndexes()

    if (!liveIndexes.length) {
      setHighlightedSlide(-1)
      return
    }

    if (liveIndexes.length === 1) {
      liveCycleIndex = 0
      setHighlightedSlide(liveIndexes[0])
      return
    }

    autoCenterTimerId = window.setTimeout(() => {
      liveCycleIndex = (liveCycleIndex + 1) % liveIndexes.length
      const nextLiveIndex = liveIndexes[liveCycleIndex]

      setHighlightedSlide(nextLiveIndex)
      setActiveSlide(nextLiveIndex, { pauseAuto: false })
      scheduleAutoCentering()
    }, LIVE_CENTER_INTERVAL)
  }

  const refreshStatuses = ({ shouldCenter = true } = {}) => {
    applyStatuses()

    if (shouldCenter && !isAutoPaused) {
      const liveIndexes = getLiveIndexes()

      if (liveIndexes.length) {
        const normalizedCycleIndex = liveCycleIndex % liveIndexes.length
        const nextLiveIndex = liveIndexes[normalizedCycleIndex]

        setHighlightedSlide(nextLiveIndex)
        setActiveSlide(nextLiveIndex, { pauseAuto: false })
      } else {
        setHighlightedSlide(-1)
        setActiveSlide(getPreferredIndex(), { pauseAuto: false })
      }
    }

    scheduleAutoCentering()
  }

  function pauseAutoCentering() {
    isAutoPaused = true
    clearAutoCenterTimer()

    if (pauseTimerId) {
      window.clearTimeout(pauseTimerId)
    }

    pauseTimerId = window.setTimeout(() => {
      isAutoPaused = false
      pauseTimerId = null
      refreshStatuses()
    }, MANUAL_PAUSE_DURATION)
  }

  const handleManualInteraction = () => {
    pauseAutoCentering()
  }

  prevButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex - 1, { pauseAuto: true })
  })

  nextButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex + 1, { pauseAuto: true })
  })

  viewport.addEventListener("pointerdown", handleManualInteraction, { passive: true })
  viewport.addEventListener("touchstart", handleManualInteraction, { passive: true })
  viewport.addEventListener("wheel", handleManualInteraction, { passive: true })
  viewport.addEventListener("scroll", () => {
    if (!isProgrammaticScroll) handleManualInteraction()
  }, { passive: true })

  window.addEventListener("resize", () => {
    if (resizeTimerId) window.clearTimeout(resizeTimerId)

    resizeTimerId = window.setTimeout(() => {
      centerSlide(activeIndex, "auto")
    }, 150)
  })

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshStatuses()
  })

  window.addEventListener("focus", () => {
    refreshStatuses()
  })

  refreshStatuses()

  statusIntervalId = window.setInterval(() => {
    refreshStatuses()
  }, STATUS_REFRESH_INTERVAL)
}

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
  initMatchSlider()
  initPopupFlow()
  initPasswordToggle()
  initFormValidation()
  initPhoneMask()
})
