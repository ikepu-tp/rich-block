import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { createKey } from '.';
import './style/style.css';

export type RichBlockTag = 'p';
export type RichBlockTagElement = HTMLParagraphElement;
export type RichBlockType = {
	attributes?: { [s: string]: string | number };
	contents: string;
	id: string;
	style?: { [s: string]: string | number };
	tag: RichBlockTag;
};
export type RichBlockEditType = {
	attributes?: { [s: string]: string | number };
	caret?: number | 'last';
	contents: string;
	id: string;
	style?: { [s: string]: string | number };
	tag: RichBlockTag;
};
export const RichBlockDefault: RichBlockType = {
	contents: '',
	id: createKey(),
	tag: 'p',
};
export function getRichBlockDefault(defaultContent: RichBlockType | {} = {}): RichBlockType {
	return {
		contents: '',
		id: createKey(),
		tag: 'p',
		...defaultContent,
	};
}
export type EditorProps = {
	content?: RichBlockType[];
	onChange?: (content: RichBlockType[]) => void;
};
export default function Editor(props: EditorProps): JSX.Element {
	const [Contents, setContents] = useState<RichBlockEditType[]>(props.content || [getRichBlockDefault()]);

	useEffect(() => {
		if (props.onChange) props.onChange(Contents);
	}, [Contents]);

	function updateContent(contents: RichBlockEditType[]): void {
		setContents(() => contents.concat());
	}
	function getContent(key: number): RichBlockEditType {
		return Contents[key];
	}
	function changeContent(key: number, content: RichBlockEditType | {} = {}): void {
		Contents[key] = { ...(Contents[key] || getRichBlockDefault()), ...content };
		updateContent(Contents);
	}
	function removeContent(key: number): void {
		if (Contents.length === 0 || !Contents[key]) return;
		Contents.splice(key, 1);
		updateContent(Contents);
	}
	return (
		<div>
			{Contents.map(
				(content: RichBlockEditType, idx: number): JSX.Element => (
					<EditorItem
						key={content.id}
						content={content}
						contentLength={Contents.length}
						idx={idx}
						getContent={getContent}
						changeContent={changeContent}
						removeContent={removeContent}
					/>
				)
			)}
			<pre>{JSON.stringify(Contents, null, 2)}</pre>
		</div>
	);
}
export type EditorItemProps = {
	content: RichBlockEditType;
	contentLength: number;
	idx: number;
	getContent: (key: number) => RichBlockEditType;
	changeContent: (key: number, content?: RichBlockEditType | {}) => void;
	removeContent: (key: number) => void;
};
export function EditorItem(props: EditorItemProps): JSX.Element {
	const [Empty, setEmpty] = useState<boolean>(props.content.contents === '');
	const Content = useRef<string>(props.content.contents);
	const contentEditableElement = useRef<RichBlockTagElement | null>(null);

	useEffect(() => {
		if (contentEditableElement.current === null) return;
		moveCaretLast(contentEditableElement.current);
	}, []);
	useEffect(() => {
		setEmpty(props.content.contents === '');
	}, [props.content.contents]);
	useEffect(() => {
		if (contentEditableElement.current === null || props.content.caret === undefined) return;
		moveCaret(contentEditableElement.current, props.content.caret);
		resetCaret();
	}, [props.content.caret]);

	function resetCaret(): void {
		props.changeContent(props.idx, { caret: undefined });
	}
	function onInput(e: FormEvent<RichBlockTagElement>): void {
		props.changeContent(props.idx, { ...props.content, contents: e.currentTarget.textContent || '' });
	}
	function onKeyDown(e: KeyboardEvent<RichBlockTagElement>): void {
		switch (e.key) {
			case 'Enter':
				//if (e.shiftKey) break;
				e.preventDefault();
				const beforeText = e.currentTarget.textContent?.substring(0, getCurrentCaret());
				const afterText = e.currentTarget.textContent?.substring(getCurrentCaret());
				props.changeContent(props.idx, { contents: beforeText });
				e.currentTarget.textContent = beforeText || '';
				props.changeContent(props.idx + 1, { caret: 0, contents: afterText });
				break;
			case 'ArrowUp':
				if (props.idx === 0) break;
				e.preventDefault();
				props.changeContent(props.idx - 1, { caret: getCurrentCaret() });
				break;
			case 'ArrowDown':
				if (props.idx + 1 >= props.contentLength) break;
				e.preventDefault();
				props.changeContent(props.idx + 1, { caret: getCurrentCaret() });
				break;
			case 'ArrowLeft':
				if (getCurrentCaret() !== 0 || props.idx === 0) break;
				e.preventDefault();
				props.changeContent(props.idx - 1, { caret: 'last' });
				break;
			case 'ArrowRight':
				if (props.idx + 1 >= props.contentLength || getCurrentCaret() !== e.currentTarget.textContent?.length) break;
				e.preventDefault();
				props.changeContent(props.idx + 1, { caret: 0 });
				break;
			case 'Backspace':
				if (props.idx === 0) break;
				e.preventDefault();
				const prevContent = props.getContent(props.idx - 1)['contents'];
				props.changeContent(props.idx - 1, {
					caret: prevContent.length,
					contents: prevContent + e.currentTarget.textContent,
					id: createKey(),
				});
				props.removeContent(props.idx);
				break;
			case 'Delete':
				if (props.idx + 1 >= props.contentLength || getCurrentCaret() !== e.currentTarget.textContent?.length) break;
				e.preventDefault();
				const nextContent = props.getContent(props.idx + 1)['contents'];
				props.changeContent(props.idx, {
					caret: e.currentTarget.textContent.length,
					contents: e.currentTarget.textContent + nextContent,
					id: createKey(),
				});
				props.removeContent(props.idx + 1);
				break;
			case 'Home':
				if (!e.ctrlKey) break;
				props.changeContent(0, { caret: 0 });
				break;
			case 'End':
				if (!e.ctrlKey) break;
				props.changeContent(props.contentLength - 1, { caret: 'last' });
				break;
		}
		console.log(e.key);
	}
	return (
		<props.content.tag
			className={`${Empty ? 'is-empty' : ''}`}
			data-placeholder="入力してください..."
			contentEditable
			onInput={onInput}
			onKeyDown={onKeyDown}
			ref={contentEditableElement}
		>
			{Content.current}
		</props.content.tag>
	);
}

export function moveCaret(
	contentEditableElement: RichBlockTagElement,
	from: number | 'last' = 0,
	to: number | null = null
): void {
	if (contentEditableElement.firstChild === null) {
		setRange(contentEditableElement, 0);
		return;
	}
	if (from === 'last') {
		moveCaretLast(contentEditableElement);
		return;
	}

	const offset = contentEditableElement.innerText.length;
	from = from > offset ? offset : from;
	setRange(
		contentEditableElement.firstChild,
		from,
		contentEditableElement.firstChild,
		to === null ? from : to > offset ? offset : to
	);
}
function setRange(from_node: Node, from: number, to_node: Node | null = null, to: number | null = null): void {
	const selection = document.getSelection();
	if (selection === null) return;
	const range = document.createRange();
	range.setStart(from_node, from);
	range.setEnd(to_node || from_node, to || from);
	selection.removeAllRanges();
	selection.addRange(range);
}
export function moveCaretLast(contentEditableElement: RichBlockTagElement): void {
	const offset = contentEditableElement.innerText.length;
	moveCaret(contentEditableElement, offset, offset);
}
export function getCurrentCaret(): number {
	const selection = window.getSelection();
	if (selection === null) return 0;
	return selection.focusOffset;
}
