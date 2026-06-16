import { AR_PHONE_PREFIX, getPhoneLocalDigits } from './phone-utils.js';

export function initPhoneMask() {
  const phoneInput = document.querySelector('input[name="phone"]');

  if (!phoneInput) {
    return;
  }

  if (typeof window.IMask !== 'function') {
    return;
  }

  const mask = window.IMask(phoneInput, {
    mask: '+{54} (000) 000 - 0000',
  });

  const getPrefixLength = () => AR_PHONE_PREFIX.length;

  const clampCaretToPrefix = () => {
    const prefixLength = getPrefixLength();

    window.requestAnimationFrame(() => {
      const selectionStart = phoneInput.selectionStart ?? prefixLength;
      const selectionEnd = phoneInput.selectionEnd ?? prefixLength;

      if (selectionStart < prefixLength || selectionEnd < prefixLength) {
        phoneInput.setSelectionRange(prefixLength, prefixLength);
      }
    });
  };

  const hasLocalDigits = () => getPhoneLocalDigits(mask.value).length > 0;

  const ensurePrefixWhileFocused = () => {
    if (document.activeElement !== phoneInput) {
      return;
    }

    if (!hasLocalDigits()) {
      mask.value = AR_PHONE_PREFIX;
    }

    clampCaretToPrefix();
  };

  phoneInput.addEventListener('focus', () => {
    if (!mask.value.trim()) {
      mask.value = AR_PHONE_PREFIX;
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    clampCaretToPrefix();
  });

  phoneInput.addEventListener('blur', () => {
    if (!hasLocalDigits()) {
      mask.value = '';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  phoneInput.addEventListener('click', clampCaretToPrefix);

  phoneInput.addEventListener('input', () => {
    ensurePrefixWhileFocused();
  });

  phoneInput.addEventListener('keyup', () => {
    ensurePrefixWhileFocused();
  });

  phoneInput.addEventListener('keydown', (event) => {
    const prefixLength = getPrefixLength();
    const selectionStart = phoneInput.selectionStart ?? prefixLength;
    const selectionEnd = phoneInput.selectionEnd ?? prefixLength;
    const isPrefixSelected = selectionStart < prefixLength;

    if ((event.key === 'Backspace' && selectionStart <= prefixLength && selectionEnd <= prefixLength)
      || (event.key === 'Delete' && isPrefixSelected)) {
      event.preventDefault();
      phoneInput.setSelectionRange(prefixLength, prefixLength);
    }
  });
}
