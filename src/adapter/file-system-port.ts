import type { Dirent } from "node:fs";
import { mkdir, readdir, stat, symlink, writeFile } from "node:fs/promises";

export type FileSystemPort = {
	readonly mkdir: (path: string, options?: { readonly recursive?: boolean }) => Promise<void>;
	readonly readdir: (path: string, options: { readonly withFileTypes: true }) => Promise<Dirent[]>;
	readonly stat: (path: string) => Promise<{ readonly isDirectory: () => boolean }>;
	readonly symlink: (target: string, path: string, type: "dir" | "file") => Promise<void>;
	readonly writeFile: (path: string, content: string, encoding: BufferEncoding) => Promise<void>;
};

export function createNodeFileSystem(): FileSystemPort {
	return {
		mkdir: (path, options) => mkdir(path, options).then(() => undefined),
		readdir,
		stat,
		symlink,
		writeFile,
	};
}
