export function initPasswordToggle() {
  const toggles = document.querySelectorAll('.field__toggle');

  toggles.forEach((toggle) => {
    const field = toggle.closest('.field');
    const passwordInput = field?.querySelector('input[type="password"], input[type="text"]');

    if (!passwordInput) {
      return;
    }

    toggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';

      passwordInput.type = isPassword ? 'text' : 'password';
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}
