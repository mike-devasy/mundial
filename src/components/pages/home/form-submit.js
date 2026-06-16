const SUBMIT_LABEL_DEFAULT = 'APROVECHÁ';
const SUBMIT_LABEL_PENDING = 'Submitting...';
const SUBMIT_ERROR_MESSAGE = 'Adapter is not connected yet.';

const setSubmitButtonState = (button, isPending) => {
  if (!button) {
    return;
  }

  const labelNode = button.querySelector('.register-form__submit-text');
  if (labelNode) {
    labelNode.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
  } else {
    button.textContent = isPending ? SUBMIT_LABEL_PENDING : SUBMIT_LABEL_DEFAULT;
  }

  button.disabled = isPending;
  button.classList.toggle('is-loading', isPending);
};

export async function handleFormSubmit(form) {
  const submitButton = form.querySelector('.register-form__submit');
  const errorBlock = form.querySelector('#register-form-error');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const adapter = window.patrickLandingAdapter;

  setSubmitButtonState(submitButton, true);

  if (errorBlock) {
    errorBlock.hidden = true;
    errorBlock.textContent = '';
  }

  try {
    if (!adapter || typeof adapter.submit !== 'function') {
      throw new Error('Missing adapter');
    }

    const response = await adapter.submit(data, { form });

    if (response?.redirectUrl) {
      window.location.assign(response.redirectUrl);
    }
  } catch (error) {
    if (errorBlock) {
      errorBlock.hidden = false;
      errorBlock.textContent = SUBMIT_ERROR_MESSAGE;
    }
  } finally {
    setSubmitButtonState(submitButton, false);
  }
}
