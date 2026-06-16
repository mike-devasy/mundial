export const AR_COUNTRY_CODE = '54';
export const AR_PHONE_PREFIX = `+${AR_COUNTRY_CODE} `;
export const AR_LOCAL_PHONE_LENGTH = 10;

export const getPhoneLocalDigits = (phoneNumber = '') => {
  const digits = String(phoneNumber).replace(/\D/g, '');

  return digits.startsWith(AR_COUNTRY_CODE) ? digits.slice(AR_COUNTRY_CODE.length) : digits;
};

export const isValidArPhone = (phoneNumber = '') => getPhoneLocalDigits(phoneNumber).length === AR_LOCAL_PHONE_LENGTH;

export const normalizePhone = (phoneNumber = '') => {
  const localDigits = getPhoneLocalDigits(phoneNumber);

  return localDigits ? `+${AR_COUNTRY_CODE}${localDigits}` : '';
};
