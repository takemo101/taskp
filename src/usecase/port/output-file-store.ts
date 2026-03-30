export type OutputFileStorePort = {
	/** セッション用ディレクトリと空の出力ファイルを作成。ファイルパスを返す */
	readonly prepare: (sessionId: string) => Promise<string>;
	/** 出力内容をファイルに書き込み */
	readonly write: (filePath: string, content: string) => Promise<void>;
	/** セッション用ディレクトリごとクリーンアップ */
	readonly cleanup: (sessionId: string) => Promise<void>;
};
