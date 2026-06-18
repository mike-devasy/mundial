//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/js/common/functions.js
var bodyLockStatus = true;
var bodyUnlock = (delay = 500) => {
	if (bodyLockStatus) {
		const lockPaddingElements = document.querySelectorAll("[data-fls-lp]");
		setTimeout(() => {
			lockPaddingElements.forEach((lockPaddingElement) => {
				lockPaddingElement.style.paddingRight = "";
			});
			document.body.style.paddingRight = "";
			document.documentElement.removeAttribute("data-fls-scrolllock");
		}, delay);
		bodyLockStatus = false;
		setTimeout(function() {
			bodyLockStatus = true;
		}, delay);
	}
};
var bodyLock = (delay = 500) => {
	if (bodyLockStatus) {
		const lockPaddingElements = document.querySelectorAll("[data-fls-lp]");
		const lockPaddingValue = window.innerWidth - document.body.offsetWidth + "px";
		lockPaddingElements.forEach((lockPaddingElement) => {
			lockPaddingElement.style.paddingRight = lockPaddingValue;
		});
		document.body.style.paddingRight = lockPaddingValue;
		document.documentElement.setAttribute("data-fls-scrolllock", "");
		bodyLockStatus = false;
		setTimeout(function() {
			bodyLockStatus = true;
		}, delay);
	}
};
//#endregion
//#region src/components/layout/popup/popup.js
var Popup = class {
	constructor(options) {
		let config = {
			logging: true,
			init: true,
			attributeOpenButton: "data-fls-popup-link",
			attributeCloseButton: "data-fls-popup-close",
			fixElementSelector: "[data-fls-lp]",
			attributeMain: "data-fls-popup",
			youtubeAttribute: "data-fls-popup-youtube",
			youtubePlaceAttribute: "data-fls-popup-youtube-place",
			setAutoplayYoutube: true,
			classes: {
				popup: "popup",
				popupContent: "data-fls-popup-body",
				popupActive: "data-fls-popup-active",
				bodyActive: "data-fls-popup-open"
			},
			focusCatch: true,
			closeEsc: true,
			bodyLock: true,
			hashSettings: {
				location: true,
				goHash: true
			},
			on: {
				beforeOpen: function() {},
				afterOpen: function() {},
				beforeClose: function() {},
				afterClose: function() {}
			}
		};
		this.youTubeCode;
		this.isOpen = false;
		this.targetOpen = {
			selector: false,
			element: false
		};
		this.previousOpen = {
			selector: false,
			element: false
		};
		this.lastClosed = {
			selector: false,
			element: false
		};
		this._dataValue = false;
		this.hash = false;
		this._reopen = false;
		this._selectorOpen = false;
		this.lastFocusEl = false;
		this._focusEl = [
			"a[href]",
			"input:not([disabled]):not([type=\"hidden\"]):not([aria-hidden])",
			"button:not([disabled]):not([aria-hidden])",
			"select:not([disabled]):not([aria-hidden])",
			"textarea:not([disabled]):not([aria-hidden])",
			"area[href]",
			"iframe",
			"object",
			"embed",
			"[contenteditable]",
			"[tabindex]:not([tabindex^=\"-\"])"
		];
		this.options = {
			...config,
			...options,
			classes: {
				...config.classes,
				...options?.classes
			},
			hashSettings: {
				...config.hashSettings,
				...options?.hashSettings
			},
			on: {
				...config.on,
				...options?.on
			}
		};
		this.bodyLock = false;
		this.options.init && this.initPopups();
	}
	initPopups() {
		this.buildPopup();
		this.eventsPopup();
	}
	buildPopup() {}
	eventsPopup() {
		document.addEventListener("click", function(e) {
			const buttonOpen = e.target.closest(`[${this.options.attributeOpenButton}]`);
			if (buttonOpen) {
				e.preventDefault();
				this._dataValue = buttonOpen.getAttribute(this.options.attributeOpenButton) ? buttonOpen.getAttribute(this.options.attributeOpenButton) : "error";
				this.youTubeCode = buttonOpen.getAttribute(this.options.youtubeAttribute) ? buttonOpen.getAttribute(this.options.youtubeAttribute) : null;
				if (this._dataValue !== "error") {
					if (!this.isOpen) this.lastFocusEl = buttonOpen;
					this.targetOpen.selector = `${this._dataValue}`;
					this._selectorOpen = true;
					this.open();
					return;
				}
				return;
			}
			if (e.target.closest(`[${this.options.attributeCloseButton}]`) || !e.target.closest(`[${this.options.classes.popupContent}]`) && this.isOpen) {
				e.preventDefault();
				this.close();
				return;
			}
		}.bind(this));
		document.addEventListener("keydown", function(e) {
			if (this.options.closeEsc && e.which == 27 && e.code === "Escape" && this.isOpen) {
				e.preventDefault();
				this.close();
				return;
			}
			if (this.options.focusCatch && e.which == 9 && this.isOpen) {
				this._focusCatch(e);
				return;
			}
		}.bind(this));
		if (this.options.hashSettings.goHash) {
			window.addEventListener("hashchange", function() {
				if (window.location.hash) this._openToHash();
				else this.close(this.targetOpen.selector);
			}.bind(this));
			if (window.location.hash) this._openToHash();
		}
	}
	open(selectorValue) {
		if (bodyLockStatus) {
			this.bodyLock = document.documentElement.hasAttribute("data-fls-scrolllock") && !this.isOpen ? true : false;
			if (selectorValue && typeof selectorValue === "string" && selectorValue.trim() !== "") {
				this.targetOpen.selector = selectorValue;
				this._selectorOpen = true;
			}
			if (this.isOpen) {
				this._reopen = true;
				this.close();
			}
			if (!this._selectorOpen) this.targetOpen.selector = this.lastClosed.selector;
			if (!this._reopen) this.previousActiveElement = document.activeElement;
			this.targetOpen.element = document.querySelector(`[${this.options.attributeMain}=${this.targetOpen.selector}]`);
			if (this.targetOpen.element) {
				const codeVideo = this.youTubeCode || this.targetOpen.element.getAttribute(`${this.options.youtubeAttribute}`);
				if (codeVideo) {
					const urlVideo = `https://www.youtube.com/embed/${codeVideo}?rel=0&showinfo=0&autoplay=1`;
					const iframe = document.createElement("iframe");
					const autoplay = this.options.setAutoplayYoutube ? "autoplay;" : "";
					iframe.setAttribute("allowfullscreen", "");
					iframe.setAttribute("allow", `${autoplay}; encrypted-media`);
					iframe.setAttribute("src", urlVideo);
					if (!this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`)) this.targetOpen.element.querySelector("[data-fls-popup-content]").setAttribute(`${this.options.youtubePlaceAttribute}`, "");
					this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`).appendChild(iframe);
				}
				if (this.options.hashSettings.location) {
					this._getHash();
					this._setHash();
				}
				this.options.on.beforeOpen(this);
				document.dispatchEvent(new CustomEvent("beforePopupOpen", { detail: { popup: this } }));
				this.targetOpen.element.setAttribute(this.options.classes.popupActive, "");
				document.documentElement.setAttribute(this.options.classes.bodyActive, "");
				if (!this._reopen) !this.bodyLock && bodyLock();
				else this._reopen = false;
				this.targetOpen.element.setAttribute("aria-hidden", "false");
				this.previousOpen.selector = this.targetOpen.selector;
				this.previousOpen.element = this.targetOpen.element;
				this._selectorOpen = false;
				this.isOpen = true;
				setTimeout(() => {
					this._focusTrap();
				}, 50);
				this.options.on.afterOpen(this);
				document.dispatchEvent(new CustomEvent("afterPopupOpen", { detail: { popup: this } }));
			}
		}
	}
	close(selectorValue) {
		if (selectorValue && typeof selectorValue === "string" && selectorValue.trim() !== "") this.previousOpen.selector = selectorValue;
		if (!this.isOpen || !bodyLockStatus) return;
		this.options.on.beforeClose(this);
		document.dispatchEvent(new CustomEvent("beforePopupClose", { detail: { popup: this } }));
		if (this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`)) setTimeout(() => {
			this.targetOpen.element.querySelector(`[${this.options.youtubePlaceAttribute}]`).innerHTML = "";
		}, 500);
		this.previousOpen.element.removeAttribute(this.options.classes.popupActive);
		this.previousOpen.element.setAttribute("aria-hidden", "true");
		if (!this._reopen) {
			document.documentElement.removeAttribute(this.options.classes.bodyActive);
			!this.bodyLock && bodyUnlock();
			this.isOpen = false;
		}
		this._removeHash();
		if (this._selectorOpen) {
			this.lastClosed.selector = this.previousOpen.selector;
			this.lastClosed.element = this.previousOpen.element;
		}
		this.options.on.afterClose(this);
		document.dispatchEvent(new CustomEvent("afterPopupClose", { detail: { popup: this } }));
		setTimeout(() => {
			this._focusTrap();
		}, 50);
	}
	_getHash() {
		if (this.options.hashSettings.location) this.hash = `#${this.targetOpen.selector}`;
	}
	_openToHash() {
		let classInHash = window.location.hash.replace("#", "");
		const openButton = document.querySelector(`[${this.options.attributeOpenButton}="${classInHash}"]`);
		if (openButton) this.youTubeCode = openButton.getAttribute(this.options.youtubeAttribute) ? openButton.getAttribute(this.options.youtubeAttribute) : null;
		if (classInHash) this.open(classInHash);
	}
	_setHash() {
		history.pushState("", "", this.hash);
	}
	_removeHash() {
		history.pushState("", "", window.location.href.split("#")[0]);
	}
	_focusCatch(e) {
		const focusable = this.targetOpen.element.querySelectorAll(this._focusEl);
		const focusArray = Array.prototype.slice.call(focusable);
		const focusedIndex = focusArray.indexOf(document.activeElement);
		if (e.shiftKey && focusedIndex === 0) {
			focusArray[focusArray.length - 1].focus();
			e.preventDefault();
		}
		if (!e.shiftKey && focusedIndex === focusArray.length - 1) {
			focusArray[0].focus();
			e.preventDefault();
		}
	}
	_focusTrap() {
		const focusable = this.previousOpen.element.querySelectorAll(this._focusEl);
		if (!this.isOpen && this.lastFocusEl) this.lastFocusEl.focus();
		else focusable[0].focus();
	}
};
document.querySelector("[data-fls-popup]") && window.addEventListener("load", () => window.flsPopup = new Popup({ hashSettings: {
	location: false,
	goHash: false
} }));
//#endregion
//#region src/components/layout/header/plugins/scroll/scroll.js
function headerScroll() {
	const header = document.querySelector("[data-fls-header-scroll]");
	const headerShow = header.hasAttribute("data-fls-header-scroll-show");
	const headerShowTimer = header.dataset.flsHeaderScrollShow ? header.dataset.flsHeaderScrollShow : 500;
	const startPoint = header.dataset.flsHeaderScroll ? header.dataset.flsHeaderScroll : 1;
	let scrollDirection = 0;
	let timer;
	document.addEventListener("scroll", function(e) {
		const scrollTop = window.scrollY;
		clearTimeout(timer);
		if (scrollTop >= startPoint) {
			!header.classList.contains("--header-scroll") && header.classList.add("--header-scroll");
			if (headerShow) {
				if (scrollTop > scrollDirection) header.classList.contains("--header-show") && header.classList.remove("--header-show");
				else !header.classList.contains("--header-show") && header.classList.add("--header-show");
				timer = setTimeout(() => {
					!header.classList.contains("--header-show") && header.classList.add("--header-show");
				}, headerShowTimer);
			}
		} else {
			header.classList.contains("--header-scroll") && header.classList.remove("--header-scroll");
			if (headerShow) header.classList.contains("--header-show") && header.classList.remove("--header-show");
		}
		scrollDirection = scrollTop <= 0 ? 0 : scrollTop;
	});
}
document.querySelector("[data-fls-header-scroll]") && window.addEventListener("load", headerScroll);
//#endregion
//#region src/components/pages/home/password-toggle.js
function initPasswordToggle() {
	document.querySelectorAll(".field__toggle").forEach((toggle) => {
		const passwordInput = toggle.closest(".field")?.querySelector("input[type=\"password\"], input[type=\"text\"]");
		if (!passwordInput) return;
		toggle.addEventListener("click", () => {
			const isPassword = passwordInput.type === "password";
			passwordInput.type = isPassword ? "text" : "password";
			toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
		});
	});
}
//#endregion
//#region src/components/pages/home/form-submit.js
var SUBMIT_LABEL_DEFAULT = "APROVECHÁ";
var SUBMIT_LABEL_PENDING = "Submitting...";
var SUBMIT_ERROR_MESSAGE = "Adapter is not connected yet.";
var setSubmitButtonState = (button, isPending) => {
	if (!button) return;
	const labelNode = button.querySelector(".register-form__submit-text");
	if (labelNode) labelNode.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
	else button.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
	button.disabled = isPending;
	button.classList.toggle("is-loading", isPending);
};
async function handleFormSubmit(form) {
	const submitButton = form.querySelector(".register-form__submit");
	const errorBlock = form.querySelector("#register-form-error");
	const formData = new FormData(form);
	const data = Object.fromEntries(formData.entries());
	const adapter = window.patrickLandingAdapter;
	setSubmitButtonState(submitButton, true);
	if (errorBlock) {
		errorBlock.hidden = true;
		errorBlock.textContent = "";
	}
	try {
		if (!adapter || typeof adapter.submit !== "function") throw new Error("Missing adapter");
		const response = await adapter.submit(data, { form });
		if (response?.redirectUrl) window.location.assign(response.redirectUrl);
	} catch (error) {
		if (errorBlock) {
			errorBlock.hidden = false;
			errorBlock.textContent = SUBMIT_ERROR_MESSAGE;
		}
	} finally {
		setSubmitButtonState(submitButton, false);
	}
}
var getPhoneLocalDigits = (phoneNumber = "") => {
	const digits = String(phoneNumber).replace(/\D/g, "");
	return digits.startsWith("54") ? digits.slice(2) : digits;
};
var isValidArPhone = (phoneNumber = "") => getPhoneLocalDigits(phoneNumber).length === 10;
var normalizePhone = (phoneNumber = "") => {
	const localDigits = getPhoneLocalDigits(phoneNumber);
	return localDigits ? `+54${localDigits}` : "";
};
//#endregion
//#region src/components/pages/home/form-validation.js
/** @format */
function initFormValidation() {
	const form = document.querySelector("#register-form");
	if (!form) return;
	const phone = form.elements.phone;
	const email = form.elements.email;
	const password = form.elements.password;
	const isAdult = form.elements.isAdult;
	const serverError = form.querySelector("#register-form-error");
	let hasAttemptedSubmit = false;
	const fieldInputs = [
		phone,
		email,
		password
	];
	const setFieldErrorVisibility = (input, isValid, shouldShow = false) => {
		const field = input?.closest(".field");
		const error = field?.querySelector(".field__error");
		if (!field) return;
		field.classList.toggle("field--invalid", shouldShow && !isValid);
		if (error) error.classList.toggle("shown", shouldShow && !isValid);
	};
	const setCheckboxErrorVisibility = (input, isValid, shouldShow = false) => {
		const field = input?.closest(".check");
		const error = field?.querySelector(".field__error");
		if (!field) return;
		field.classList.toggle("field--invalid", shouldShow && !isValid);
		if (error) error.classList.toggle("shown", shouldShow && !isValid);
	};
	const validateInput = (input, shouldShow = false) => {
		let isValid = false;
		if (input === phone) isValid = isValidArPhone(phone.value);
		if (input === email) {
			const value = email.value.trim();
			isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
		}
		if (input === password) isValid = password.value.trim().length >= 8;
		setFieldErrorVisibility(input, isValid, shouldShow);
		return isValid;
	};
	const validateCheckbox = (shouldShow = false) => {
		const isValid = Boolean(isAdult?.checked);
		setCheckboxErrorVisibility(isAdult, isValid, shouldShow);
		return isValid;
	};
	const validateForm = (shouldShow = false) => {
		const fieldsValid = fieldInputs.map((input) => validateInput(input, shouldShow)).every(Boolean);
		const checkboxValid = validateCheckbox(shouldShow);
		return fieldsValid && checkboxValid;
	};
	fieldInputs.forEach((input) => {
		input.addEventListener("input", () => {
			if (serverError) {
				serverError.hidden = true;
				serverError.textContent = "";
			}
			validateForm(hasAttemptedSubmit);
		});
		input.addEventListener("blur", () => {
			validateForm(hasAttemptedSubmit);
		});
	});
	if (isAdult) isAdult.addEventListener("change", () => {
		validateForm(hasAttemptedSubmit);
	});
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		hasAttemptedSubmit = true;
		if (!validateForm(true)) return;
		if (phone) phone.value = normalizePhone(phone.value);
		await handleFormSubmit(form);
	});
	validateForm();
}
//#endregion
//#region src/components/pages/home/phone-select.js
/** @format */
var PHONE_PREFIX = `+54`;
var PHONE_MASK_START = `${PHONE_PREFIX} (`;
var formatArPhone = (value = "") => {
	const digits = getPhoneLocalDigits(value).slice(0, 10);
	if (!digits.length) return PHONE_PREFIX;
	const areaCode = digits.slice(0, 3);
	const firstPart = digits.slice(3, 6);
	const secondPart = digits.slice(6, 10);
	let formatted = `${PHONE_MASK_START}${areaCode}`;
	if (areaCode.length === 3) formatted += ")";
	if (firstPart.length) formatted += ` ${firstPart}`;
	if (secondPart.length) formatted += ` - ${secondPart}`;
	return formatted;
};
function initPhoneMask() {
	const phoneInput = document.querySelector("input[name=\"phone\"]");
	if (!phoneInput || phoneInput.dataset.phoneMaskInitialized === "true") return;
	phoneInput.dataset.phoneMaskInitialized = "true";
	phoneInput.value = PHONE_PREFIX;
	phoneInput.placeholder = "";
	phoneInput.inputMode = "numeric";
	phoneInput.autocomplete = "tel";
	const prefixLength = PHONE_PREFIX.length;
	const moveCaretToEnd = () => {
		window.requestAnimationFrame(() => {
			const position = phoneInput.value.length;
			phoneInput.setSelectionRange(position, position);
		});
	};
	const moveCaretAfterPrefix = () => {
		window.requestAnimationFrame(() => {
			const position = Math.max(prefixLength, phoneInput.value.length);
			phoneInput.setSelectionRange(position, position);
		});
	};
	phoneInput.addEventListener("focus", moveCaretAfterPrefix);
	phoneInput.addEventListener("click", () => {
		if ((phoneInput.selectionStart ?? 0) < prefixLength) moveCaretAfterPrefix();
	});
	phoneInput.addEventListener("input", () => {
		const localDigits = getPhoneLocalDigits(phoneInput.value);
		phoneInput.value = formatArPhone(localDigits);
		if (localDigits.length) moveCaretToEnd();
		else moveCaretAfterPrefix();
	});
	phoneInput.addEventListener("keydown", (event) => {
		const selectionStart = phoneInput.selectionStart ?? prefixLength;
		const selectionEnd = phoneInput.selectionEnd ?? selectionStart;
		const localDigits = getPhoneLocalDigits(phoneInput.value);
		if (event.key === "Backspace" && selectionStart <= prefixLength && selectionEnd <= prefixLength || event.key === "Delete" && selectionStart < prefixLength) {
			event.preventDefault();
			moveCaretAfterPrefix();
			return;
		}
		if ((event.key === "Backspace" || event.key === "Delete") && localDigits.length <= 1) {
			event.preventDefault();
			phoneInput.value = PHONE_PREFIX;
			phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
			moveCaretAfterPrefix();
		}
	});
}
//#endregion
//#region src/assets/img/cards/01.webp?url
var _01_default = "" + new URL("../assets/img/cards/01.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/02.webp?url
var _02_default = "" + new URL("../assets/img/cards/02.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/03.webp?url
var _03_default = "" + new URL("../assets/img/cards/03.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/04.webp?url
var _04_default = "" + new URL("../assets/img/cards/04.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/05.webp?url
var _05_default = "" + new URL("../assets/img/cards/05.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/06.webp?url
var _06_default = "" + new URL("../assets/img/cards/06.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/07.webp?url
var _07_default = "" + new URL("../assets/img/cards/07.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/08.webp?url
var _08_default = "" + new URL("../assets/img/cards/08.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/09.webp?url
var _09_default = "" + new URL("../assets/img/cards/09.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/10.webp?url
var _10_default = "" + new URL("../assets/img/cards/10.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/11.webp?url
var _11_default = "" + new URL("../assets/img/cards/11.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/12.webp?url
var _12_default = "" + new URL("../assets/img/cards/12.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/13.webp?url
var _13_default = "" + new URL("../assets/img/cards/13.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/14.webp?url
var _14_default = "" + new URL("../assets/img/cards/14.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/15.webp?url
var _15_default = "" + new URL("../assets/img/cards/15.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/16.webp?url
var _16_default = "" + new URL("../assets/img/cards/16.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/17.webp?url
var _17_default = "" + new URL("../assets/img/cards/17.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/18.webp?url
var _18_default = "" + new URL("../assets/img/cards/18.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/19.webp?url
var _19_default = "" + new URL("../assets/img/cards/19.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/20.webp?url
var _20_default = "" + new URL("../assets/img/cards/20.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/21.webp?url
var _21_default = "" + new URL("../assets/img/cards/21.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/22.webp?url
var _22_default = "" + new URL("../assets/img/cards/22.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/23.webp?url
var _23_default = "" + new URL("../assets/img/cards/23.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/24.webp?url
var _24_default = "" + new URL("../assets/img/cards/24.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/25.webp?url
var _25_default = "" + new URL("../assets/img/cards/25.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/26.webp?url
var _26_default = "" + new URL("../assets/img/cards/26.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/27.webp?url
var _27_default = "" + new URL("../assets/img/cards/27.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/28.webp?url
var _28_default = "" + new URL("../assets/img/cards/28.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/29.webp?url
var _29_default = "" + new URL("../assets/img/cards/29.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/30.webp?url
var _30_default = "" + new URL("../assets/img/cards/30.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/31.webp?url
var _31_default = "" + new URL("../assets/img/cards/31.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/32.webp?url
var _32_default = "" + new URL("../assets/img/cards/32.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/33.webp?url
var _33_default = "" + new URL("../assets/img/cards/33.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/34.webp?url
var _34_default = "" + new URL("../assets/img/cards/34.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/35.webp?url
var _35_default = "" + new URL("../assets/img/cards/35.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/36.webp?url
var _36_default = "" + new URL("../assets/img/cards/36.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/37.webp?url
var _37_default = "" + new URL("../assets/img/cards/37.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/38.webp?url
var _38_default = "" + new URL("../assets/img/cards/38.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/39.webp?url
var _39_default = "" + new URL("../assets/img/cards/39.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/40.webp?url
var _40_default = "" + new URL("../assets/img/cards/40.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/41.webp?url
var _41_default = "" + new URL("../assets/img/cards/41.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/42.webp?url
var _42_default = "" + new URL("../assets/img/cards/42.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/43.webp?url
var _43_default = "" + new URL("../assets/img/cards/43.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/44.webp?url
var _44_default = "" + new URL("../assets/img/cards/44.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/45.webp?url
var _45_default = "" + new URL("../assets/img/cards/45.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/46.webp?url
var _46_default = "" + new URL("../assets/img/cards/46.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/47.webp?url
var _47_default = "" + new URL("../assets/img/cards/47.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/48.webp?url
var _48_default = "" + new URL("../assets/img/cards/48.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/49.webp?url
var _49_default = "" + new URL("../assets/img/cards/49.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/50.webp?url
var _50_default = "" + new URL("../assets/img/cards/50.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/51.webp?url
var _51_default = "" + new URL("../assets/img/cards/51.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/52.webp?url
var _52_default = "" + new URL("../assets/img/cards/52.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/53.webp?url
var _53_default = "" + new URL("../assets/img/cards/53.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/54.webp?url
var _54_default = "" + new URL("../assets/img/cards/54.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/55.webp?url
var _55_default = "" + new URL("../assets/img/cards/55.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/56.webp?url
var _56_default = "" + new URL("../assets/img/cards/56.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/57.webp?url
var _57_default = "" + new URL("../assets/img/cards/57.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/58.webp?url
var _58_default = "" + new URL("../assets/img/cards/58.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/59.webp?url
var _59_default = "" + new URL("../assets/img/cards/59.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/60.webp?url
var _60_default = "" + new URL("../assets/img/cards/60.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/61.webp?url
var _61_default = "" + new URL("../assets/img/cards/61.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/62.webp?url
var _62_default = "" + new URL("../assets/img/cards/62.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/63.webp?url
var _63_default = "" + new URL("../assets/img/cards/63.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/64.webp?url
var _64_default = "" + new URL("../assets/img/cards/64.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/65.webp?url
var _65_default = "" + new URL("../assets/img/cards/65.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/66.webp?url
var _66_default = "" + new URL("../assets/img/cards/66.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/67.webp?url
var _67_default = "" + new URL("../assets/img/cards/67.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/68.webp?url
var _68_default = "" + new URL("../assets/img/cards/68.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/69.webp?url
var _69_default = "" + new URL("../assets/img/cards/69.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/70.webp?url
var _70_default = "" + new URL("../assets/img/cards/70.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/71.webp?url
var _71_default = "" + new URL("../assets/img/cards/71.webp", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/cze-rsa.webp?url
var cze_rsa_default = "" + new URL("../assets/img/cards/cze-rsa.webp", import.meta.url).href;
//#endregion
//#region src/components/pages/home/matches-data.js
var cardImages = /* #__PURE__ */ Object.assign({
	"../../../assets/img/cards/01.webp": _01_default,
	"../../../assets/img/cards/02.webp": _02_default,
	"../../../assets/img/cards/03.webp": _03_default,
	"../../../assets/img/cards/04.webp": _04_default,
	"../../../assets/img/cards/05.webp": _05_default,
	"../../../assets/img/cards/06.webp": _06_default,
	"../../../assets/img/cards/07.webp": _07_default,
	"../../../assets/img/cards/08.webp": _08_default,
	"../../../assets/img/cards/09.webp": _09_default,
	"../../../assets/img/cards/10.webp": _10_default,
	"../../../assets/img/cards/11.webp": _11_default,
	"../../../assets/img/cards/12.webp": _12_default,
	"../../../assets/img/cards/13.webp": _13_default,
	"../../../assets/img/cards/14.webp": _14_default,
	"../../../assets/img/cards/15.webp": _15_default,
	"../../../assets/img/cards/16.webp": _16_default,
	"../../../assets/img/cards/17.webp": _17_default,
	"../../../assets/img/cards/18.webp": _18_default,
	"../../../assets/img/cards/19.webp": _19_default,
	"../../../assets/img/cards/20.webp": _20_default,
	"../../../assets/img/cards/21.webp": _21_default,
	"../../../assets/img/cards/22.webp": _22_default,
	"../../../assets/img/cards/23.webp": _23_default,
	"../../../assets/img/cards/24.webp": _24_default,
	"../../../assets/img/cards/25.webp": _25_default,
	"../../../assets/img/cards/26.webp": _26_default,
	"../../../assets/img/cards/27.webp": _27_default,
	"../../../assets/img/cards/28.webp": _28_default,
	"../../../assets/img/cards/29.webp": _29_default,
	"../../../assets/img/cards/30.webp": _30_default,
	"../../../assets/img/cards/31.webp": _31_default,
	"../../../assets/img/cards/32.webp": _32_default,
	"../../../assets/img/cards/33.webp": _33_default,
	"../../../assets/img/cards/34.webp": _34_default,
	"../../../assets/img/cards/35.webp": _35_default,
	"../../../assets/img/cards/36.webp": _36_default,
	"../../../assets/img/cards/37.webp": _37_default,
	"../../../assets/img/cards/38.webp": _38_default,
	"../../../assets/img/cards/39.webp": _39_default,
	"../../../assets/img/cards/40.webp": _40_default,
	"../../../assets/img/cards/41.webp": _41_default,
	"../../../assets/img/cards/42.webp": _42_default,
	"../../../assets/img/cards/43.webp": _43_default,
	"../../../assets/img/cards/44.webp": _44_default,
	"../../../assets/img/cards/45.webp": _45_default,
	"../../../assets/img/cards/46.webp": _46_default,
	"../../../assets/img/cards/47.webp": _47_default,
	"../../../assets/img/cards/48.webp": _48_default,
	"../../../assets/img/cards/49.webp": _49_default,
	"../../../assets/img/cards/50.webp": _50_default,
	"../../../assets/img/cards/51.webp": _51_default,
	"../../../assets/img/cards/52.webp": _52_default,
	"../../../assets/img/cards/53.webp": _53_default,
	"../../../assets/img/cards/54.webp": _54_default,
	"../../../assets/img/cards/55.webp": _55_default,
	"../../../assets/img/cards/56.webp": _56_default,
	"../../../assets/img/cards/57.webp": _57_default,
	"../../../assets/img/cards/58.webp": _58_default,
	"../../../assets/img/cards/59.webp": _59_default,
	"../../../assets/img/cards/60.webp": _60_default,
	"../../../assets/img/cards/61.webp": _61_default,
	"../../../assets/img/cards/62.webp": _62_default,
	"../../../assets/img/cards/63.webp": _63_default,
	"../../../assets/img/cards/64.webp": _64_default,
	"../../../assets/img/cards/65.webp": _65_default,
	"../../../assets/img/cards/66.webp": _66_default,
	"../../../assets/img/cards/67.webp": _67_default,
	"../../../assets/img/cards/68.webp": _68_default,
	"../../../assets/img/cards/69.webp": _69_default,
	"../../../assets/img/cards/70.webp": _70_default,
	"../../../assets/img/cards/71.webp": _71_default,
	"../../../assets/img/cards/cze-rsa.webp": cze_rsa_default
});
var getCardImage = (fileName) => {
	const image = cardImages[`../../../assets/img/cards/${fileName}`];
	if (!image) throw new Error(`Missing match card image mapping: ${fileName}`);
	return image;
};
var matches = [
	[
		"2026-06-11-mex-rsa",
		"2026-06-11T16:00:00-03:00",
		"01.webp",
		["México", "MEX"],
		["Sudáfrica", "RSA"]
	],
	[
		"2026-06-11-kor-cze",
		"2026-06-11T23:00:00-03:00",
		"02.webp",
		["Corea del Sur", "KOR"],
		["Chequia", "CZE"]
	],
	[
		"2026-06-12-can-bih",
		"2026-06-12T16:00:00-03:00",
		"03.webp",
		["Canadá", "CAN"],
		["Bosnia", "BIH"]
	],
	[
		"2026-06-12-usa-par",
		"2026-06-12T22:00:00-03:00",
		"04.webp",
		["Estados Unidos", "USA"],
		["Paraguay", "PAR"]
	],
	[
		"2026-06-13-qat-sui",
		"2026-06-13T16:00:00-03:00",
		"05.webp",
		["Catar", "QAT"],
		["Suiza", "SUI"]
	],
	[
		"2026-06-13-bra-mar",
		"2026-06-13T19:00:00-03:00",
		"06.webp",
		["Brasil", "BRA"],
		["Marruecos", "MAR"]
	],
	[
		"2026-06-13-hai-sco",
		"2026-06-13T22:00:00-03:00",
		"07.webp",
		["Haití", "HAI"],
		["Escocia", "SCO"]
	],
	[
		"2026-06-14-aus-tur",
		"2026-06-14T01:00:00-03:00",
		"08.webp",
		["Australia", "AUS"],
		["Turquía", "TUR"]
	],
	[
		"2026-06-14-ger-cuw",
		"2026-06-14T14:00:00-03:00",
		"09.webp",
		["Alemania", "GER"],
		["Curazao", "CUW"]
	],
	[
		"2026-06-14-ned-jpn",
		"2026-06-14T17:00:00-03:00",
		"10.webp",
		["Países Bajos", "NED"],
		["Japón", "JPN"]
	],
	[
		"2026-06-14-civ-ecu",
		"2026-06-14T20:00:00-03:00",
		"11.webp",
		["Costa de Marfil", "CIV"],
		["Ecuador", "ECU"]
	],
	[
		"2026-06-14-swe-tun",
		"2026-06-14T23:00:00-03:00",
		"12.webp",
		["Suecia", "SWE"],
		["Túnez", "TUN"]
	],
	[
		"2026-06-15-esp-cpv",
		"2026-06-15T13:00:00-03:00",
		"13.webp",
		["España", "ESP"],
		["Cabo Verde", "CPV"]
	],
	[
		"2026-06-15-bel-egy",
		"2026-06-15T16:00:00-03:00",
		"14.webp",
		["Bélgica", "BEL"],
		["Egipto", "EGY"]
	],
	[
		"2026-06-15-ksa-uru",
		"2026-06-15T19:00:00-03:00",
		"15.webp",
		["Arabia Saudí", "KSA"],
		["Uruguay", "URU"]
	],
	[
		"2026-06-15-irn-nzl",
		"2026-06-15T22:00:00-03:00",
		"16.webp",
		["RI de Irán", "IRN"],
		["Nueva Zelanda", "NZL"]
	],
	[
		"2026-06-16-fra-sen",
		"2026-06-16T16:00:00-03:00",
		"17.webp",
		["Francia", "FRA"],
		["Senegal", "SEN"]
	],
	[
		"2026-06-16-irq-nor",
		"2026-06-16T19:00:00-03:00",
		"18.webp",
		["Irak", "IRQ"],
		["Noruega", "NOR"]
	],
	[
		"2026-06-16-arg-alg",
		"2026-06-16T22:00:00-03:00",
		"19.webp",
		["Argentina", "ARG"],
		["Argelia", "ALG"]
	],
	[
		"2026-06-17-aut-jor",
		"2026-06-17T01:00:00-03:00",
		"20.webp",
		["Austria", "AUT"],
		["Jordania", "JOR"]
	],
	[
		"2026-06-17-por-cod",
		"2026-06-17T14:00:00-03:00",
		"21.webp",
		["Portugal", "POR"],
		["RD Congo", "COD"]
	],
	[
		"2026-06-17-eng-cro",
		"2026-06-17T17:00:00-03:00",
		"22.webp",
		["Inglaterra", "ENG"],
		["Croacia", "CRO"]
	],
	[
		"2026-06-17-gha-pan",
		"2026-06-17T20:00:00-03:00",
		"23.webp",
		["Ghana", "GHA"],
		["Panamá", "PAN"]
	],
	[
		"2026-06-17-uzb-col",
		"2026-06-17T23:00:00-03:00",
		"24.webp",
		["Uzbekistán", "UZB"],
		["Colombia", "COL"]
	],
	[
		"2026-06-18-cze-rsa",
		"2026-06-18T13:00:00-03:00",
		"cze-rsa.webp",
		["Chequia", "CZE"],
		["Sudáfrica", "RSA"]
	],
	[
		"2026-06-18-sui-bih",
		"2026-06-18T16:00:00-03:00",
		"25.webp",
		["Suiza", "SUI"],
		["Bosnia", "BIH"]
	],
	[
		"2026-06-18-can-qat",
		"2026-06-18T19:00:00-03:00",
		"26.webp",
		["Canadá", "CAN"],
		["Catar", "QAT"]
	],
	[
		"2026-06-18-mex-kor",
		"2026-06-18T22:00:00-03:00",
		"27.webp",
		["México", "MEX"],
		["Corea del Sur", "KOR"]
	],
	[
		"2026-06-19-usa-aus",
		"2026-06-19T16:00:00-03:00",
		"28.webp",
		["Estados Unidos", "USA"],
		["Australia", "AUS"]
	],
	[
		"2026-06-19-sco-mar",
		"2026-06-19T19:00:00-03:00",
		"29.webp",
		["Escocia", "SCO"],
		["Marruecos", "MAR"]
	],
	[
		"2026-06-19-bra-hai",
		"2026-06-19T21:30:00-03:00",
		"30.webp",
		["Brasil", "BRA"],
		["Haití", "HAI"]
	],
	[
		"2026-06-20-tur-par",
		"2026-06-20T00:00:00-03:00",
		"31.webp",
		["Turquía", "TUR"],
		["Paraguay", "PAR"]
	],
	[
		"2026-06-20-ned-swe",
		"2026-06-20T14:00:00-03:00",
		"32.webp",
		["Países Bajos", "NED"],
		["Suecia", "SWE"]
	],
	[
		"2026-06-20-ger-civ",
		"2026-06-20T17:00:00-03:00",
		"33.webp",
		["Alemania", "GER"],
		["Costa de Marfil", "CIV"]
	],
	[
		"2026-06-20-ecu-cuw",
		"2026-06-20T21:00:00-03:00",
		"34.webp",
		["Ecuador", "ECU"],
		["Curazao", "CUW"]
	],
	[
		"2026-06-21-tun-jpn",
		"2026-06-21T01:00:00-03:00",
		"35.webp",
		["Túnez", "TUN"],
		["Japón", "JPN"]
	],
	[
		"2026-06-21-esp-ksa",
		"2026-06-21T13:00:00-03:00",
		"36.webp",
		["España", "ESP"],
		["Arabia Saudí", "KSA"]
	],
	[
		"2026-06-21-bel-irn",
		"2026-06-21T16:00:00-03:00",
		"37.webp",
		["Bélgica", "BEL"],
		["RI de Irán", "IRN"]
	],
	[
		"2026-06-21-uru-cpv",
		"2026-06-21T19:00:00-03:00",
		"38.webp",
		["Uruguay", "URU"],
		["Cabo Verde", "CPV"]
	],
	[
		"2026-06-21-nzl-egy",
		"2026-06-21T22:00:00-03:00",
		"39.webp",
		["Nueva Zelanda", "NZL"],
		["Egipto", "EGY"]
	],
	[
		"2026-06-22-arg-aut",
		"2026-06-22T14:00:00-03:00",
		"40.webp",
		["Argentina", "ARG"],
		["Austria", "AUT"]
	],
	[
		"2026-06-22-fra-irq",
		"2026-06-22T18:00:00-03:00",
		"41.webp",
		["Francia", "FRA"],
		["Irak", "IRQ"]
	],
	[
		"2026-06-22-nor-sen",
		"2026-06-22T21:00:00-03:00",
		"42.webp",
		["Noruega", "NOR"],
		["Senegal", "SEN"]
	],
	[
		"2026-06-23-jor-alg",
		"2026-06-23T00:00:00-03:00",
		"43.webp",
		["Jordania", "JOR"],
		["Argelia", "ALG"]
	],
	[
		"2026-06-23-por-uzb",
		"2026-06-23T14:00:00-03:00",
		"44.webp",
		["Portugal", "POR"],
		["Uzbekistán", "UZB"]
	],
	[
		"2026-06-23-eng-gha",
		"2026-06-23T17:00:00-03:00",
		"45.webp",
		["Inglaterra", "ENG"],
		["Ghana", "GHA"]
	],
	[
		"2026-06-23-pan-cro",
		"2026-06-23T20:00:00-03:00",
		"46.webp",
		["Panamá", "PAN"],
		["Croacia", "CRO"]
	],
	[
		"2026-06-23-col-cod",
		"2026-06-23T23:00:00-03:00",
		"47.webp",
		["Colombia", "COL"],
		["RD Congo", "COD"]
	],
	[
		"2026-06-24-sui-can",
		"2026-06-24T16:00:00-03:00",
		"48.webp",
		["Suiza", "SUI"],
		["Canadá", "CAN"]
	],
	[
		"2026-06-24-bih-qat",
		"2026-06-24T16:00:00-03:00",
		"49.webp",
		["Bosnia", "BIH"],
		["Catar", "QAT"]
	],
	[
		"2026-06-24-sco-bra",
		"2026-06-24T19:00:00-03:00",
		"50.webp",
		["Escocia", "SCO"],
		["Brasil", "BRA"]
	],
	[
		"2026-06-24-mar-hai",
		"2026-06-24T19:00:00-03:00",
		"51.webp",
		["Marruecos", "MAR"],
		["Haití", "HAI"]
	],
	[
		"2026-06-24-cze-mex",
		"2026-06-24T22:00:00-03:00",
		"52.webp",
		["Chequia", "CZE"],
		["México", "MEX"]
	],
	[
		"2026-06-24-rsa-kor",
		"2026-06-24T22:00:00-03:00",
		"53.webp",
		["Sudáfrica", "RSA"],
		["Corea del Sur", "KOR"]
	],
	[
		"2026-06-25-cuw-civ",
		"2026-06-25T17:00:00-03:00",
		"54.webp",
		["Curazao", "CUW"],
		["Costa de Marfil", "CIV"]
	],
	[
		"2026-06-25-ecu-ger",
		"2026-06-25T17:00:00-03:00",
		"55.webp",
		["Ecuador", "ECU"],
		["Alemania", "GER"]
	],
	[
		"2026-06-25-jpn-swe",
		"2026-06-25T20:00:00-03:00",
		"56.webp",
		["Japón", "JPN"],
		["Suecia", "SWE"]
	],
	[
		"2026-06-25-tun-ned",
		"2026-06-25T20:00:00-03:00",
		"57.webp",
		["Túnez", "TUN"],
		["Países Bajos", "NED"]
	],
	[
		"2026-06-25-tur-usa",
		"2026-06-25T23:00:00-03:00",
		"58.webp",
		["Turquía", "TUR"],
		["Estados Unidos", "USA"]
	],
	[
		"2026-06-25-par-aus",
		"2026-06-25T23:00:00-03:00",
		"59.webp",
		["Paraguay", "PAR"],
		["Australia", "AUS"]
	],
	[
		"2026-06-26-nor-fra",
		"2026-06-26T16:00:00-03:00",
		"60.webp",
		["Noruega", "NOR"],
		["Francia", "FRA"]
	],
	[
		"2026-06-26-sen-irq",
		"2026-06-26T16:00:00-03:00",
		"61.webp",
		["Senegal", "SEN"],
		["Irak", "IRQ"]
	],
	[
		"2026-06-26-cpv-ksa",
		"2026-06-26T21:00:00-03:00",
		"62.webp",
		["Cabo Verde", "CPV"],
		["Arabia Saudí", "KSA"]
	],
	[
		"2026-06-26-uru-esp",
		"2026-06-26T21:00:00-03:00",
		"63.webp",
		["Uruguay", "URU"],
		["España", "ESP"]
	],
	[
		"2026-06-27-egy-irn",
		"2026-06-27T00:00:00-03:00",
		"64.webp",
		["Egipto", "EGY"],
		["RI de Irán", "IRN"]
	],
	[
		"2026-06-27-nzl-bel",
		"2026-06-27T00:00:00-03:00",
		"65.webp",
		["Nueva Zelanda", "NZL"],
		["Bélgica", "BEL"]
	],
	[
		"2026-06-27-pan-eng",
		"2026-06-27T18:00:00-03:00",
		"66.webp",
		["Panamá", "PAN"],
		["Inglaterra", "ENG"]
	],
	[
		"2026-06-27-cro-gha",
		"2026-06-27T18:00:00-03:00",
		"67.webp",
		["Croacia", "CRO"],
		["Ghana", "GHA"]
	],
	[
		"2026-06-27-col-por",
		"2026-06-27T20:30:00-03:00",
		"68.webp",
		["Colombia", "COL"],
		["Portugal", "POR"]
	],
	[
		"2026-06-27-cod-uzb",
		"2026-06-27T20:30:00-03:00",
		"69.webp",
		["RD Congo", "COD"],
		["Uzbekistán", "UZB"]
	],
	[
		"2026-06-27-alg-aut",
		"2026-06-27T23:00:00-03:00",
		"70.webp",
		["Argelia", "ALG"],
		["Austria", "AUT"]
	],
	[
		"2026-06-27-jor-arg",
		"2026-06-27T23:00:00-03:00",
		"71.webp",
		["Jordania", "JOR"],
		["Argentina", "ARG"]
	]
].map(([id, kickoff, imageFile, home, away]) => ({
	id,
	date: kickoff.slice(0, 10),
	kickoff,
	image: getCardImage(imageFile),
	home: {
		name: home[0],
		code: home[1]
	},
	away: {
		name: away[0],
		code: away[1]
	}
}));
//#endregion
//#region src/components/pages/home/home.js
var LIVE_DURATION_MINUTES = 120;
var STATUS_REFRESH_INTERVAL = 3600 * 1e3;
var MANUAL_PAUSE_DURATION = 12 * 1e3;
var LIVE_CENTER_INTERVAL = 5 * 1e3;
var FORCED_PAST_LAST_DATE = "2026-06-16";
var formatMatchDate = (date) => {
	const [, month, day] = date.split("-");
	return `${day}.${month}`;
};
var clampIndex = (index, maxIndex) => Math.max(0, Math.min(index, maxIndex));
var getMatchStatus = (match, now = /* @__PURE__ */ new Date()) => {
	if (match.date <= FORCED_PAST_LAST_DATE) return "past";
	const kickoffTime = new Date(match.kickoff).getTime();
	const liveEndsAt = kickoffTime + LIVE_DURATION_MINUTES * 60 * 1e3;
	const currentTime = now.getTime();
	if (currentTime >= kickoffTime && currentTime < liveEndsAt) return "live";
	if (currentTime >= liveEndsAt) return "past";
	return "upcoming";
};
var createMatchSlide = (match, index) => {
	const slide = document.createElement("article");
	const matchLabel = `${formatMatchDate(match.date)}: ${match.home.name} vs ${match.away.name}`;
	slide.className = "match-slider__slide";
	slide.dataset.matchIndex = String(index);
	slide.dataset.matchId = match.id;
	slide.setAttribute("aria-label", matchLabel);
	const image = document.createElement("img");
	image.className = "match-slider__image";
	image.src = match.image;
	image.alt = matchLabel;
	image.loading = index > 4 ? "lazy" : "eager";
	const meta = document.createElement("span");
	meta.className = "match-slider__meta";
	meta.textContent = matchLabel;
	slide.append(image, meta);
	return slide;
};
var initMatchSlider = () => {
	const track = document.querySelector("[data-match-slider-track]");
	const viewport = document.querySelector("[data-match-slider-viewport]");
	const prevButton = document.querySelector("[data-match-slider-prev]");
	const nextButton = document.querySelector("[data-match-slider-next]");
	if (!track || !viewport || track.dataset.matchSliderInitialized === "true") return;
	const slides = matches.map(createMatchSlide);
	const maxIndex = slides.length - 1;
	let activeIndex = Math.min(2, maxIndex);
	let statuses = [];
	let autoCenterTimerId = null;
	let pauseTimerId = null;
	let resizeTimerId = null;
	let liveCycleIndex = 0;
	let highlightedIndex = -1;
	let isAutoPaused = false;
	let isProgrammaticScroll = false;
	track.replaceChildren(...slides);
	track.dataset.matchSliderInitialized = "true";
	const getLiveIndexes = () => statuses.reduce((indexes, status, index) => {
		if (status === "live") indexes.push(index);
		return indexes;
	}, []);
	const getPreferredIndex = () => {
		const liveIndexes = getLiveIndexes();
		if (liveIndexes.length) return highlightedIndex >= 0 ? highlightedIndex : liveIndexes[liveCycleIndex % liveIndexes.length];
		const nextUpcomingIndex = statuses.findIndex((status) => status === "upcoming");
		if (nextUpcomingIndex >= 0) return nextUpcomingIndex;
		return maxIndex;
	};
	const centerSlide = (index, behavior = "smooth") => {
		const slide = slides[index];
		if (!slide) return;
		const nextScrollLeft = slide.offsetLeft - (viewport.clientWidth - slide.offsetWidth) / 2;
		isProgrammaticScroll = true;
		viewport.scrollTo({
			left: nextScrollLeft,
			behavior
		});
		window.setTimeout(() => {
			isProgrammaticScroll = false;
		}, 900);
	};
	const clearAutoCenterTimer = () => {
		if (!autoCenterTimerId) return;
		window.clearTimeout(autoCenterTimerId);
		autoCenterTimerId = null;
	};
	const updateControls = () => {
		if (prevButton) prevButton.disabled = activeIndex === 0;
		if (nextButton) nextButton.disabled = activeIndex === maxIndex;
	};
	const setHighlightedSlide = (nextIndex) => {
		highlightedIndex = statuses[nextIndex] === "live" ? nextIndex : -1;
		slides.forEach((slide, index) => {
			slide.classList.toggle("is-highlighted", index === highlightedIndex);
		});
	};
	const setActiveSlide = (nextIndex, { shouldCenter = true, behavior = "smooth", pauseAuto = false } = {}) => {
		activeIndex = clampIndex(nextIndex, maxIndex);
		updateControls();
		if (pauseAuto) pauseAutoCentering();
		if (shouldCenter) centerSlide(activeIndex, behavior);
	};
	const applyStatuses = () => {
		statuses = matches.map((match) => getMatchStatus(match));
		slides.forEach((slide, index) => {
			const status = statuses[index];
			slide.dataset.matchStatus = status;
			slide.classList.toggle("is-past", status === "past");
			slide.classList.toggle("is-live", status === "live");
			slide.classList.toggle("is-upcoming", status === "upcoming");
		});
		if (highlightedIndex >= 0 && statuses[highlightedIndex] !== "live") setHighlightedSlide(-1);
	};
	const scheduleAutoCentering = () => {
		clearAutoCenterTimer();
		if (isAutoPaused) return;
		const liveIndexes = getLiveIndexes();
		if (!liveIndexes.length) {
			setHighlightedSlide(-1);
			return;
		}
		if (liveIndexes.length === 1) {
			liveCycleIndex = 0;
			setHighlightedSlide(liveIndexes[0]);
			return;
		}
		autoCenterTimerId = window.setTimeout(() => {
			liveCycleIndex = (liveCycleIndex + 1) % liveIndexes.length;
			const nextLiveIndex = liveIndexes[liveCycleIndex];
			setHighlightedSlide(nextLiveIndex);
			setActiveSlide(nextLiveIndex, { pauseAuto: false });
			scheduleAutoCentering();
		}, LIVE_CENTER_INTERVAL);
	};
	const refreshStatuses = ({ shouldCenter = true } = {}) => {
		applyStatuses();
		if (shouldCenter && !isAutoPaused) {
			const liveIndexes = getLiveIndexes();
			if (liveIndexes.length) {
				const nextLiveIndex = liveIndexes[liveCycleIndex % liveIndexes.length];
				setHighlightedSlide(nextLiveIndex);
				setActiveSlide(nextLiveIndex, { pauseAuto: false });
			} else {
				setHighlightedSlide(-1);
				setActiveSlide(getPreferredIndex(), { pauseAuto: false });
			}
		}
		scheduleAutoCentering();
	};
	function pauseAutoCentering() {
		isAutoPaused = true;
		clearAutoCenterTimer();
		if (pauseTimerId) window.clearTimeout(pauseTimerId);
		pauseTimerId = window.setTimeout(() => {
			isAutoPaused = false;
			pauseTimerId = null;
			refreshStatuses();
		}, MANUAL_PAUSE_DURATION);
	}
	const handleManualInteraction = () => {
		pauseAutoCentering();
	};
	prevButton?.addEventListener("click", () => {
		setActiveSlide(activeIndex - 1, { pauseAuto: true });
	});
	nextButton?.addEventListener("click", () => {
		setActiveSlide(activeIndex + 1, { pauseAuto: true });
	});
	viewport.addEventListener("pointerdown", handleManualInteraction, { passive: true });
	viewport.addEventListener("touchstart", handleManualInteraction, { passive: true });
	viewport.addEventListener("wheel", handleManualInteraction, { passive: true });
	viewport.addEventListener("scroll", () => {
		if (!isProgrammaticScroll) handleManualInteraction();
	}, { passive: true });
	window.addEventListener("resize", () => {
		if (resizeTimerId) window.clearTimeout(resizeTimerId);
		resizeTimerId = window.setTimeout(() => {
			centerSlide(activeIndex, "auto");
		}, 150);
	});
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden) refreshStatuses();
	});
	window.addEventListener("focus", () => {
		refreshStatuses();
	});
	refreshStatuses();
	window.setInterval(() => {
		refreshStatuses();
	}, STATUS_REFRESH_INTERVAL);
};
var initPopupFlow = () => {
	const flow = document.querySelector("[data-popup-flow]");
	if (!flow || flow.dataset.popupFlowInitialized === "true") return;
	const bonus = flow.querySelector("[data-popup-bonus]");
	const form = flow.querySelector("[data-popup-form]");
	const bonusButton = flow.querySelector("[data-popup-bonus-button]");
	if (!bonus || !form || !bonusButton) return;
	flow.dataset.popupFlowInitialized = "true";
	const setStep = (step) => {
		const isFormStep = step === "form";
		flow.dataset.step = step;
		bonus.hidden = isFormStep;
		form.hidden = !isFormStep;
		if (isFormStep) form.querySelector("input:not([type='hidden']), button, a")?.focus({ preventScroll: true });
	};
	bonusButton.addEventListener("click", () => setStep("form"));
	document.addEventListener("afterPopupOpen", (event) => {
		if (event.detail?.popup?.targetOpen?.selector === "popup") setStep("bonus");
	});
};
document.addEventListener("DOMContentLoaded", () => {
	initMatchSlider();
	initPopupFlow();
	initPasswordToggle();
	initFormValidation();
	initPhoneMask();
});
//#endregion
