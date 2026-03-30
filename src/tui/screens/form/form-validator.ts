type FormValidationError = {
	readonly name: string;
	readonly message: string;
};

type FormValidator = (values: Readonly<Record<string, string>>) => FormValidationError | undefined;

export type { FormValidationError, FormValidator };
