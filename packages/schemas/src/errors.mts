export const requiredErrorMsg = () => 'Required field';

export const lengthErrorMsg = (min: number, max: number) =>
  `Should be between ${min} and ${max} characters long`;

export const alphanumericErrorMsg = () =>
  'Should only contain alphanumeric characters and underscores';
