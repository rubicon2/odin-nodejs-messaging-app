export const requiredErrorMsg = () => 'Required field';

export const lengthErrorMsg = (min: number, max: number) =>
  `Should be between ${min} and ${max} characters long`;

export const alphanumericErrorMsg = () =>
  'Should only contain alphanumeric characters and underscores';

export const numberErrorMsg = () => 'Should be a number';

export const positiveNumberMsg = () => 'Should be a positive number';

export const intErrorMsg = () => 'Should be a whole number';

export const sortOrderErrorMsg = () => 'Should be asc or desc';
