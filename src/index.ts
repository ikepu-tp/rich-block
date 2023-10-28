export * from './Editor';
export type * from './Editor';

export function createKey(): string {
	return Math.random().toString(32).substring(2);
}
