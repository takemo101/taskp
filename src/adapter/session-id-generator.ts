import type { SessionId } from "../core/execution/session";

/**
 * スキル実行ごとに一意のセッション ID を生成する。
 * ランダム値生成（副作用）を伴うため Adapter 層に配置。
 */
export function generateSessionId(): SessionId {
	const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
	return `tskp_${random}` as SessionId;
}
