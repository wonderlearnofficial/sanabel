export const OTP_LENGTH = 4;

export const createEmptyOTP = (): string[] => Array(OTP_LENGTH).fill("");

export const isCompleteOTP = (digits: readonly string[]): boolean =>
  digits.length === OTP_LENGTH && digits.every((digit) => /^\d$/.test(digit));
