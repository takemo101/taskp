export type TextPart = { readonly type: "text"; readonly text: string };
export type ImagePart = {
	readonly type: "image";
	readonly data: Uint8Array;
	readonly mediaType: string;
};
export type ContentPart = TextPart | ImagePart;
