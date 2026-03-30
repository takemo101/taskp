/**
 * branded type により、生の string との取り違えを型レベルで防止する
 */
export type SessionId = string & { readonly __brand: "SessionId" };
