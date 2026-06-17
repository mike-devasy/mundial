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
var AR_PHONE_PREFIX = `+54 `;
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
function initPhoneMask() {
	const phoneInput = document.querySelector("input[name=\"phone\"]");
	if (!phoneInput) return;
	if (typeof window.IMask !== "function") return;
	const mask = window.IMask(phoneInput, { mask: "+{54} (000) 000 - 0000" });
	const getPrefixLength = () => AR_PHONE_PREFIX.length;
	const clampCaretToPrefix = () => {
		const prefixLength = getPrefixLength();
		window.requestAnimationFrame(() => {
			const selectionStart = phoneInput.selectionStart ?? prefixLength;
			const selectionEnd = phoneInput.selectionEnd ?? prefixLength;
			if (selectionStart < prefixLength || selectionEnd < prefixLength) phoneInput.setSelectionRange(prefixLength, prefixLength);
		});
	};
	const hasLocalDigits = () => getPhoneLocalDigits(mask.value).length > 0;
	const ensurePrefixWhileFocused = () => {
		if (document.activeElement !== phoneInput) return;
		if (!hasLocalDigits()) mask.value = AR_PHONE_PREFIX;
		clampCaretToPrefix();
	};
	phoneInput.addEventListener("focus", () => {
		if (!mask.value.trim()) {
			mask.value = AR_PHONE_PREFIX;
			phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
		}
		clampCaretToPrefix();
	});
	phoneInput.addEventListener("blur", () => {
		if (!hasLocalDigits()) {
			mask.value = "";
			phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
		}
	});
	phoneInput.addEventListener("click", clampCaretToPrefix);
	phoneInput.addEventListener("input", () => {
		ensurePrefixWhileFocused();
	});
	phoneInput.addEventListener("keyup", () => {
		ensurePrefixWhileFocused();
	});
	phoneInput.addEventListener("keydown", (event) => {
		const prefixLength = getPrefixLength();
		const selectionStart = phoneInput.selectionStart ?? prefixLength;
		const selectionEnd = phoneInput.selectionEnd ?? prefixLength;
		const isPrefixSelected = selectionStart < prefixLength;
		if (event.key === "Backspace" && selectionStart <= prefixLength && selectionEnd <= prefixLength || event.key === "Delete" && isPrefixSelected) {
			event.preventDefault();
			phoneInput.setSelectionRange(prefixLength, prefixLength);
		}
	});
}
//#endregion
//#region src/assets/img/cards/01.png?url
var _01_default = "" + new URL("../assets/img/cards/01.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/02.png?url
var _02_default = "" + new URL("../assets/img/cards/02.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/03.png?url
var _03_default = "" + new URL("../assets/img/cards/03.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/04.png?url
var _04_default = "" + new URL("../assets/img/cards/04.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/05.png?url
var _05_default = "" + new URL("../assets/img/cards/05.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/06.png?url
var _06_default = "" + new URL("../assets/img/cards/06.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/07.png?url
var _07_default = "" + new URL("../assets/img/cards/07.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/08.png?url
var _08_default = "" + new URL("../assets/img/cards/08.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/09.png?url
var _09_default = "" + new URL("../assets/img/cards/09.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/10.png?url
var _10_default = "" + new URL("../assets/img/cards/10.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/11.png?url
var _11_default = "" + new URL("../assets/img/cards/11.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/12.png?url
var _12_default = "" + new URL("../assets/img/cards/12.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/13.png?url
var _13_default = "" + new URL("../assets/img/cards/13.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/14.png?url
var _14_default = "" + new URL("../assets/img/cards/14.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/15.png?url
var _15_default = "" + new URL("../assets/img/cards/15.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/16.png?url
var _16_default = "" + new URL("../assets/img/cards/16.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/17.png?url
var _17_default = "" + new URL("../assets/img/cards/17.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/18.png?url
var _18_default = "" + new URL("../assets/img/cards/18.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/19.png?url
var _19_default = "" + new URL("../assets/img/cards/19.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/20.png?url
var _20_default = "" + new URL("../assets/img/cards/20.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/21.png?url
var _21_default = "" + new URL("../assets/img/cards/21.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/22.png?url
var _22_default = "" + new URL("../assets/img/cards/22.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/23.png?url
var _23_default = "" + new URL("../assets/img/cards/23.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/24.png?url
var _24_default = "" + new URL("../assets/img/cards/24.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/25.png?url
var _25_default = "" + new URL("../assets/img/cards/25.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/26.png?url
var _26_default = "" + new URL("../assets/img/cards/26.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/27.png?url
var _27_default = "" + new URL("../assets/img/cards/27.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/28.png?url
var _28_default = "" + new URL("../assets/img/cards/28.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/29.png?url
var _29_default = "" + new URL("../assets/img/cards/29.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/30.png?url
var _30_default = "" + new URL("../assets/img/cards/30.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/31.png?url
var _31_default = "" + new URL("../assets/img/cards/31.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/32.png?url
var _32_default = "" + new URL("../assets/img/cards/32.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/33.png?url
var _33_default = "" + new URL("../assets/img/cards/33.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/34.png?url
var _34_default = "" + new URL("../assets/img/cards/34.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/35.png?url
var _35_default = "" + new URL("../assets/img/cards/35.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/36.png?url
var _36_default = "" + new URL("../assets/img/cards/36.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/37.png?url
var _37_default = "" + new URL("../assets/img/cards/37.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/38.png?url
var _38_default = "" + new URL("../assets/img/cards/38.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/39.png?url
var _39_default = "" + new URL("../assets/img/cards/39.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/40.png?url
var _40_default = "" + new URL("../assets/img/cards/40.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/41.png?url
var _41_default = "" + new URL("../assets/img/cards/41.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/42.png?url
var _42_default = "" + new URL("../assets/img/cards/42.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/43.png?url
var _43_default = "" + new URL("../assets/img/cards/43.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/44.png?url
var _44_default = "" + new URL("../assets/img/cards/44.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/45.png?url
var _45_default = "" + new URL("../assets/img/cards/45.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/46.png?url
var _46_default = "" + new URL("../assets/img/cards/46.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/47.png?url
var _47_default = "" + new URL("../assets/img/cards/47.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/48.png?url
var _48_default = "" + new URL("../assets/img/cards/48.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/49.png?url
var _49_default = "" + new URL("../assets/img/cards/49.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/50.png?url
var _50_default = "" + new URL("../assets/img/cards/50.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/51.png?url
var _51_default = "" + new URL("../assets/img/cards/51.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/52.png?url
var _52_default = "" + new URL("../assets/img/cards/52.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/53.png?url
var _53_default = "" + new URL("../assets/img/cards/53.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/54.png?url
var _54_default = "" + new URL("../assets/img/cards/54.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/55.png?url
var _55_default = "" + new URL("../assets/img/cards/55.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/56.png?url
var _56_default = "" + new URL("../assets/img/cards/56.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/57.png?url
var _57_default = "" + new URL("../assets/img/cards/57.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/58.png?url
var _58_default = "" + new URL("../assets/img/cards/58.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/59.png?url
var _59_default = "" + new URL("../assets/img/cards/59.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/60.png?url
var _60_default = "" + new URL("../assets/img/cards/60.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/61.png?url
var _61_default = "" + new URL("../assets/img/cards/61.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/62.png?url
var _62_default = "" + new URL("../assets/img/cards/62.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/63.png?url
var _63_default = "" + new URL("../assets/img/cards/63.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/64.png?url
var _64_default = "" + new URL("../assets/img/cards/64.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/65.png?url
var _65_default = "" + new URL("../assets/img/cards/65.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/66.png?url
var _66_default = "" + new URL("../assets/img/cards/66.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/67.png?url
var _67_default = "" + new URL("../assets/img/cards/67.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/68.png?url
var _68_default = "" + new URL("../assets/img/cards/68.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/69.png?url
var _69_default = "" + new URL("../assets/img/cards/69.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/70.png?url
var _70_default = "" + new URL("../assets/img/cards/70.png", import.meta.url).href;
//#endregion
//#region src/assets/img/cards/71.png?url
var _71_default = "" + new URL("../assets/img/cards/71.png", import.meta.url).href;
//#endregion
//#region src/components/pages/home/matches-data.js
var cardImages = /* #__PURE__ */ Object.assign({
	"../../../assets/img/cards/01.png": _01_default,
	"../../../assets/img/cards/02.png": _02_default,
	"../../../assets/img/cards/03.png": _03_default,
	"../../../assets/img/cards/04.png": _04_default,
	"../../../assets/img/cards/05.png": _05_default,
	"../../../assets/img/cards/06.png": _06_default,
	"../../../assets/img/cards/07.png": _07_default,
	"../../../assets/img/cards/08.png": _08_default,
	"../../../assets/img/cards/09.png": _09_default,
	"../../../assets/img/cards/10.png": _10_default,
	"../../../assets/img/cards/11.png": _11_default,
	"../../../assets/img/cards/12.png": _12_default,
	"../../../assets/img/cards/13.png": _13_default,
	"../../../assets/img/cards/14.png": _14_default,
	"../../../assets/img/cards/15.png": _15_default,
	"../../../assets/img/cards/16.png": _16_default,
	"../../../assets/img/cards/17.png": _17_default,
	"../../../assets/img/cards/18.png": _18_default,
	"../../../assets/img/cards/19.png": _19_default,
	"../../../assets/img/cards/20.png": _20_default,
	"../../../assets/img/cards/21.png": _21_default,
	"../../../assets/img/cards/22.png": _22_default,
	"../../../assets/img/cards/23.png": _23_default,
	"../../../assets/img/cards/24.png": _24_default,
	"../../../assets/img/cards/25.png": _25_default,
	"../../../assets/img/cards/26.png": _26_default,
	"../../../assets/img/cards/27.png": _27_default,
	"../../../assets/img/cards/28.png": _28_default,
	"../../../assets/img/cards/29.png": _29_default,
	"../../../assets/img/cards/30.png": _30_default,
	"../../../assets/img/cards/31.png": _31_default,
	"../../../assets/img/cards/32.png": _32_default,
	"../../../assets/img/cards/33.png": _33_default,
	"../../../assets/img/cards/34.png": _34_default,
	"../../../assets/img/cards/35.png": _35_default,
	"../../../assets/img/cards/36.png": _36_default,
	"../../../assets/img/cards/37.png": _37_default,
	"../../../assets/img/cards/38.png": _38_default,
	"../../../assets/img/cards/39.png": _39_default,
	"../../../assets/img/cards/40.png": _40_default,
	"../../../assets/img/cards/41.png": _41_default,
	"../../../assets/img/cards/42.png": _42_default,
	"../../../assets/img/cards/43.png": _43_default,
	"../../../assets/img/cards/44.png": _44_default,
	"../../../assets/img/cards/45.png": _45_default,
	"../../../assets/img/cards/46.png": _46_default,
	"../../../assets/img/cards/47.png": _47_default,
	"../../../assets/img/cards/48.png": _48_default,
	"../../../assets/img/cards/49.png": _49_default,
	"../../../assets/img/cards/50.png": _50_default,
	"../../../assets/img/cards/51.png": _51_default,
	"../../../assets/img/cards/52.png": _52_default,
	"../../../assets/img/cards/53.png": _53_default,
	"../../../assets/img/cards/54.png": _54_default,
	"../../../assets/img/cards/55.png": _55_default,
	"../../../assets/img/cards/56.png": _56_default,
	"../../../assets/img/cards/57.png": _57_default,
	"../../../assets/img/cards/58.png": _58_default,
	"../../../assets/img/cards/59.png": _59_default,
	"../../../assets/img/cards/60.png": _60_default,
	"../../../assets/img/cards/61.png": _61_default,
	"../../../assets/img/cards/62.png": _62_default,
	"../../../assets/img/cards/63.png": _63_default,
	"../../../assets/img/cards/64.png": _64_default,
	"../../../assets/img/cards/65.png": _65_default,
	"../../../assets/img/cards/66.png": _66_default,
	"../../../assets/img/cards/67.png": _67_default,
	"../../../assets/img/cards/68.png": _68_default,
	"../../../assets/img/cards/69.png": _69_default,
	"../../../assets/img/cards/70.png": _70_default,
	"../../../assets/img/cards/71.png": _71_default
});
var getCardImage = (fileName) => cardImages[`../../../assets/img/cards/${fileName}`];
var matches = [
	[
		"2026-06-11-mex-rsa",
		"2026-06-11",
		"01.png",
		["México", "MEX"],
		["Sudáfrica", "RSA"]
	],
	[
		"2026-06-12-kor-cze",
		"2026-06-12",
		"02.png",
		["Corea del Sur", "KOR"],
		["Chequia", "CZE"]
	],
	[
		"2026-06-12-can-bih",
		"2026-06-12",
		"03.png",
		["Canadá", "CAN"],
		["Bosnia", "BIH"]
	],
	[
		"2026-06-13-usa-par",
		"2026-06-13",
		"04.png",
		["Estados Unidos", "USA"],
		["Paraguay", "PAR"]
	],
	[
		"2026-06-13-qat-sui",
		"2026-06-13",
		"05.png",
		["Catar", "QAT"],
		["Suiza", "SUI"]
	],
	[
		"2026-06-14-bra-mar",
		"2026-06-14",
		"06.png",
		["Brasil", "BRA"],
		["Marruecos", "MAR"]
	],
	[
		"2026-06-14-hai-sco",
		"2026-06-14",
		"07.png",
		["Haití", "HAI"],
		["Escocia", "SCO"]
	],
	[
		"2026-06-14-aus-tur",
		"2026-06-14",
		"08.png",
		["Australia", "AUS"],
		["Turquía", "TUR"]
	],
	[
		"2026-06-14-ger-cuw",
		"2026-06-14",
		"09.png",
		["Alemania", "GER"],
		["Curazao", "CUW"]
	],
	[
		"2026-06-14-ned-jpn",
		"2026-06-14",
		"10.png",
		["Países Bajos", "NED"],
		["Japón", "JPN"]
	],
	[
		"2026-06-15-civ-ecu",
		"2026-06-15",
		"11.png",
		["Costa de Marfil", "CIV"],
		["Ecuador", "ECU"]
	],
	[
		"2026-06-15-swe-tun",
		"2026-06-15",
		"12.png",
		["Suecia", "SWE"],
		["Túnez", "TUN"]
	],
	[
		"2026-06-15-esp-cpv",
		"2026-06-15",
		"13.png",
		["España", "ESP"],
		["Cabo Verde", "CPV"]
	],
	[
		"2026-06-15-bel-egy",
		"2026-06-15",
		"14.png",
		["Bélgica", "BEL"],
		["Egipto", "EGY"]
	],
	[
		"2026-06-16-ksa-uru",
		"2026-06-16",
		"15.png",
		["Arabia Saudí", "KSA"],
		["Uruguay", "URU"]
	],
	[
		"2026-06-16-irn-nzl",
		"2026-06-16",
		"16.png",
		["RI de Irán", "IRN"],
		["Nueva Zelanda", "NZL"]
	],
	[
		"2026-06-16-fra-sen",
		"2026-06-16",
		"17.png",
		["Francia", "FRA"],
		["Senegal", "SEN"]
	],
	[
		"2026-06-17-irq-nor",
		"2026-06-17",
		"18.png",
		["Irak", "IRQ"],
		["Noruega", "NOR"]
	],
	[
		"2026-06-17-arg-alg",
		"2026-06-17",
		"19.png",
		["Argentina", "ARG"],
		["Argelia", "ALG"]
	],
	[
		"2026-06-17-aut-jor",
		"2026-06-17",
		"20.png",
		["Austria", "AUT"],
		["Jordania", "JOR"]
	],
	[
		"2026-06-17-por-cod",
		"2026-06-17",
		"21.png",
		["Portugal", "POR"],
		["RD Congo", "COD"]
	],
	[
		"2026-06-17-eng-cro",
		"2026-06-17",
		"22.png",
		["Inglaterra", "ENG"],
		["Croacia", "CRO"]
	],
	[
		"2026-06-18-gha-pan",
		"2026-06-18",
		"23.png",
		["Ghana", "GHA"],
		["Panamá", "PAN"]
	],
	[
		"2026-06-18-uzb-col",
		"2026-06-18",
		"24.png",
		["Uzbekistán", "UZB"],
		["Colombia", "COL"]
	],
	[
		"2026-06-18-sui-bih",
		"2026-06-18",
		"25.png",
		["Suiza", "SUI"],
		["Bosnia", "BIH"]
	],
	[
		"2026-06-19-can-qat",
		"2026-06-19",
		"26.png",
		["Canadá", "CAN"],
		["Catar", "QAT"]
	],
	[
		"2026-06-19-mex-kor",
		"2026-06-19",
		"27.png",
		["México", "MEX"],
		["Corea del Sur", "KOR"]
	],
	[
		"2026-06-19-usa-aus",
		"2026-06-19",
		"28.png",
		["Estados Unidos", "USA"],
		["Australia", "AUS"]
	],
	[
		"2026-06-20-sco-mar",
		"2026-06-20",
		"29.png",
		["Escocia", "SCO"],
		["Marruecos", "MAR"]
	],
	[
		"2026-06-20-bra-hai",
		"2026-06-20",
		"30.png",
		["Brasil", "BRA"],
		["Haití", "HAI"]
	],
	[
		"2026-06-20-tur-par",
		"2026-06-20",
		"31.png",
		["Turquía", "TUR"],
		["Paraguay", "PAR"]
	],
	[
		"2026-06-20-ned-swe",
		"2026-06-20",
		"32.png",
		["Países Bajos", "NED"],
		["Suecia", "SWE"]
	],
	[
		"2026-06-20-ger-civ",
		"2026-06-20",
		"33.png",
		["Alemania", "GER"],
		["Costa de Marfil", "CIV"]
	],
	[
		"2026-06-21-ecu-cuw",
		"2026-06-21",
		"34.png",
		["Ecuador", "ECU"],
		["Curazao", "CUW"]
	],
	[
		"2026-06-21-tun-jpn",
		"2026-06-21",
		"35.png",
		["Túnez", "TUN"],
		["Japón", "JPN"]
	],
	[
		"2026-06-21-esp-ksa",
		"2026-06-21",
		"36.png",
		["España", "ESP"],
		["Arabia Saudí", "KSA"]
	],
	[
		"2026-06-21-bel-irn",
		"2026-06-21",
		"37.png",
		["Bélgica", "BEL"],
		["RI de Irán", "IRN"]
	],
	[
		"2026-06-22-uru-cpv",
		"2026-06-22",
		"38.png",
		["Uruguay", "URU"],
		["Cabo Verde", "CPV"]
	],
	[
		"2026-06-22-nzl-egy",
		"2026-06-22",
		"39.png",
		["Nueva Zelanda", "NZL"],
		["Egipto", "EGY"]
	],
	[
		"2026-06-22-arg-aut",
		"2026-06-22",
		"40.png",
		["Argentina", "ARG"],
		["Austria", "AUT"]
	],
	[
		"2026-06-23-fra-irq",
		"2026-06-23",
		"41.png",
		["Francia", "FRA"],
		["Irak", "IRQ"]
	],
	[
		"2026-06-23-nor-sen",
		"2026-06-23",
		"42.png",
		["Noruega", "NOR"],
		["Senegal", "SEN"]
	],
	[
		"2026-06-23-jor-alg",
		"2026-06-23",
		"43.png",
		["Jordania", "JOR"],
		["Argelia", "ALG"]
	],
	[
		"2026-06-23-por-uzb",
		"2026-06-23",
		"44.png",
		["Portugal", "POR"],
		["Uzbekistán", "UZB"]
	],
	[
		"2026-06-23-eng-gha",
		"2026-06-23",
		"45.png",
		["Inglaterra", "ENG"],
		["Ghana", "GHA"]
	],
	[
		"2026-06-24-pan-cro",
		"2026-06-24",
		"46.png",
		["Panamá", "PAN"],
		["Croacia", "CRO"]
	],
	[
		"2026-06-24-col-cod",
		"2026-06-24",
		"47.png",
		["Colombia", "COL"],
		["RD Congo", "COD"]
	],
	[
		"2026-06-24-sui-can",
		"2026-06-24",
		"48.png",
		["Suiza", "SUI"],
		["Canadá", "CAN"]
	],
	[
		"2026-06-24-bih-qat",
		"2026-06-24",
		"49.png",
		["Bosnia", "BIH"],
		["Catar", "QAT"]
	],
	[
		"2026-06-25-sco-bra",
		"2026-06-25",
		"50.png",
		["Escocia", "SCO"],
		["Brasil", "BRA"]
	],
	[
		"2026-06-25-mar-hai",
		"2026-06-25",
		"51.png",
		["Marruecos", "MAR"],
		["Haití", "HAI"]
	],
	[
		"2026-06-25-cze-mex",
		"2026-06-25",
		"52.png",
		["Chequia", "CZE"],
		["México", "MEX"]
	],
	[
		"2026-06-25-rsa-kor",
		"2026-06-25",
		"53.png",
		["Sudáfrica", "RSA"],
		["Corea del Sur", "KOR"]
	],
	[
		"2026-06-25-cuw-civ",
		"2026-06-25",
		"54.png",
		["Curazao", "CUW"],
		["Costa de Marfil", "CIV"]
	],
	[
		"2026-06-25-ecu-ger",
		"2026-06-25",
		"55.png",
		["Ecuador", "ECU"],
		["Alemania", "GER"]
	],
	[
		"2026-06-26-jpn-swe",
		"2026-06-26",
		"56.png",
		["Japón", "JPN"],
		["Suecia", "SWE"]
	],
	[
		"2026-06-26-tun-ned",
		"2026-06-26",
		"57.png",
		["Túnez", "TUN"],
		["Países Bajos", "NED"]
	],
	[
		"2026-06-26-tur-usa",
		"2026-06-26",
		"58.png",
		["Turquía", "TUR"],
		["Estados Unidos", "USA"]
	],
	[
		"2026-06-26-par-aus",
		"2026-06-26",
		"59.png",
		["Paraguay", "PAR"],
		["Australia", "AUS"]
	],
	[
		"2026-06-26-nor-fra",
		"2026-06-26",
		"60.png",
		["Noruega", "NOR"],
		["Francia", "FRA"]
	],
	[
		"2026-06-26-sen-irq",
		"2026-06-26",
		"61.png",
		["Senegal", "SEN"],
		["Irak", "IRQ"]
	],
	[
		"2026-06-27-cpv-ksa",
		"2026-06-27",
		"62.png",
		["Cabo Verde", "CPV"],
		["Arabia Saudí", "KSA"]
	],
	[
		"2026-06-27-uru-esp",
		"2026-06-27",
		"63.png",
		["Uruguay", "URU"],
		["España", "ESP"]
	],
	[
		"2026-06-27-egy-irn",
		"2026-06-27",
		"64.png",
		["Egipto", "EGY"],
		["RI de Irán", "IRN"]
	],
	[
		"2026-06-27-nzl-bel",
		"2026-06-27",
		"65.png",
		["Nueva Zelanda", "NZL"],
		["Bélgica", "BEL"]
	],
	[
		"2026-06-28-pan-eng",
		"2026-06-28",
		"66.png",
		["Panamá", "PAN"],
		["Inglaterra", "ENG"]
	],
	[
		"2026-06-28-cro-gha",
		"2026-06-28",
		"67.png",
		["Croacia", "CRO"],
		["Ghana", "GHA"]
	],
	[
		"2026-06-28-col-por",
		"2026-06-28",
		"68.png",
		["Colombia", "COL"],
		["Portugal", "POR"]
	],
	[
		"2026-06-28-cod-uzb",
		"2026-06-28",
		"69.png",
		["RD Congo", "COD"],
		["Uzbekistán", "UZB"]
	],
	[
		"2026-06-28-alg-aut",
		"2026-06-28",
		"70.png",
		["Argelia", "ALG"],
		["Austria", "AUT"]
	],
	[
		"2026-06-28-jor-arg",
		"2026-06-28",
		"71.png",
		["Jordania", "JOR"],
		["Argentina", "ARG"]
	]
].map(([id, date, imageFile, home, away]) => ({
	id,
	date,
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
var formatMatchDate = (date) => {
	const [, month, day] = date.split("-");
	return `${day}.${month}`;
};
var createMatchSlide = (match, index) => {
	const slide = document.createElement("article");
	const matchLabel = `${formatMatchDate(match.date)}: ${match.home.name} vs ${match.away.name}`;
	slide.className = "match-slider__slide";
	slide.dataset.matchIndex = String(index);
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
	let activeIndex = Math.min(2, slides.length - 1);
	track.replaceChildren(...slides);
	track.dataset.matchSliderInitialized = "true";
	const setActiveSlide = (nextIndex, shouldScroll = true) => {
		activeIndex = Math.max(0, Math.min(nextIndex, slides.length - 1));
		slides.forEach((slide, index) => {
			slide.classList.toggle("match-slider__slide--active", index === activeIndex);
		});
		if (prevButton) prevButton.disabled = activeIndex === 0;
		if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;
		if (shouldScroll) slides[activeIndex]?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center"
		});
	};
	prevButton?.addEventListener("click", () => setActiveSlide(activeIndex - 1));
	nextButton?.addEventListener("click", () => setActiveSlide(activeIndex + 1));
	setActiveSlide(activeIndex, false);
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
