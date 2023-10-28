import React, { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { createKey } from '.';
import './style/style.css';
import { Col, Form, OverlayTrigger, Popover, Row } from 'react-bootstrap';

export type RichBlockTag = 'p' | 'a' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type RichBlockEditTag = 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type RichBlockTagElement = HTMLParagraphElement | HTMLSpanElement | HTMLHeadingElement;
export type RichBlockAttributeType = { [s: string]: string | number } & {
	href?: string;
	target?: string;
};
export type RichBlockStyleType = { [s: string]: string | number } & {
	color?: string;
	fontSize?: string;
};
export type RichBlockType = {
	attribute?: RichBlockAttributeType;
	contents: string;
	id: string;
	style?: RichBlockStyleType;
	tag: RichBlockTag;
};
export type RichBlockEditType = RichBlockType & {
	caret?: number | 'last';
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
export type getContentHandler = (key: number) => RichBlockEditType;
export type changeContentHandler = (key: number, content?: RichBlockEditType | {}) => void;
export type removeContentHandler = (key: number) => void;
export type EditorItemProps = {
	content: RichBlockEditType;
	contentLength: number;
	idx: number;
	getContent: getContentHandler;
	changeContent: changeContentHandler;
	removeContent: removeContentHandler;
};
export function EditorItem(props: EditorItemProps): JSX.Element {
	const [Empty, setEmpty] = useState<boolean>(props.content.contents === '');
	const [Focus, setFocus] = useState<boolean>(false);
	const Content = useRef<string>(props.content.contents);
	const Tag: RichBlockEditTag = props.content.tag === 'a' ? 'span' : props.content.tag;
	const contentEditableElement = useRef<RichBlockTagElement | any | null>(null);

	useEffect(() => {
		if (contentEditableElement.current === null) return;
		moveCaretLast(contentEditableElement.current);
	}, []);
	useEffect(() => {
		setEmpty(props.content.contents === '');
	}, [props.content.contents]);
	useEffect(() => {
		if (contentEditableElement.current === null) return;
		moveCaretLast(contentEditableElement.current);
	}, [props.content.tag]);
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
	function onFocus(): void {
		setFocus(true);
	}
	function onBlur(): void {
		setFocus(false);
	}
	return (
		<BlockMenu content={props.content} idx={props.idx} show={Focus} changeContent={props.changeContent}>
			<Tag
				className={`${Empty ? 'is-empty' : ''}`}
				data-placeholder="入力してください..."
				contentEditable
				onInput={onInput}
				onKeyDown={onKeyDown}
				onFocus={onFocus}
				onBlur={onBlur}
				style={props.content.style}
				{...props.content.attribute}
				ref={contentEditableElement}
			>
				{Content.current}
			</Tag>
		</BlockMenu>
	);
}
type BlockMenuProps = {
	children: React.ReactElement;
	content: RichBlockEditType;
	idx: number;
	show: boolean;
	changeContent: changeContentHandler;
};
function BlockMenu(props: BlockMenuProps): JSX.Element {
	const [Focus, setFocus] = useState<boolean>(false);
	function onFocus(): void {
		setFocus(true);
	}
	function onBlur(): void {
		setFocus(false);
	}
	function changeTag(e: ChangeEvent<HTMLSelectElement>): void {
		props.changeContent(props.idx, { tag: e.currentTarget.value });
	}
	function changeStyle(e: ChangeEvent<HTMLInputElement>): void {
		const _style: RichBlockStyleType = { ...{}, ...props.content.style };
		_style[e.currentTarget.name] = e.currentTarget.value;
		props.changeContent(props.idx, { style: _style });
	}
	function changeAttr(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void {
		const _attr: RichBlockAttributeType = { ...{}, ...props.content.attribute };
		_attr[e.currentTarget.name] = e.currentTarget.value;
		props.changeContent(props.idx, { attributes: _attr });
	}
	return (
		<>
			<OverlayTrigger
				show={props.show || Focus}
				placement="left"
				overlay={
					<Popover id={props.content.id} onFocus={onFocus} onBlur={onBlur}>
						<Popover.Body>
							<Row>
								<Col xs="auto">
									<select value={props.content.tag} onChange={changeTag}>
										<option value="p">段落</option>
										<option value="a">リンク</option>
										<option value="h1">見出し1</option>
										<option value="h2">見出し2</option>
										<option value="h3">見出し3</option>
										<option value="h4">見出し4</option>
										<option value="h5">見出し5</option>
										<option value="h6">見出し6</option>
									</select>
								</Col>
								<Col xs="auto" className="border-start">
									<div className="text-center">フォント</div>
									<Row>
										<Col xs="auto" className="pe-0 py-0">
											<Form.Control
												type="color"
												name="color"
												value={props.content.style?.color}
												onChange={changeStyle}
											/>
										</Col>
										<Col xs="auto" className="p-0">
											<Form.Control
												type="text"
												name="fontSize"
												placeholder="16px"
												value={props.content.style?.fontSize}
												onChange={changeStyle}
												style={{ width: '70px' }}
											/>
										</Col>
									</Row>
								</Col>
							</Row>
							<Row className={`${props.content.tag === 'a' ? '' : 'd-none'} border-top`}>
								<Col xs="auto" className={`${props.content.tag === 'a' ? '' : 'd-none'}`}>
									<div className={`${props.content.tag === 'a' ? '' : 'd-none'}`}>
										<div className="text-center">リンク</div>
										<Form.Control
											type="url"
											name="href"
											placeholder="https://"
											value={props.content.attribute?.href}
											onChange={changeAttr}
										/>
									</div>
									<select name="target" value={props.content.attribute?.target} onChange={changeAttr}>
										<option value="_self">同じタブで表示</option>
										<option value="_blank">別タブで表示</option>
									</select>
								</Col>
							</Row>
						</Popover.Body>
					</Popover>
				}
			>
				{props.children}
			</OverlayTrigger>
		</>
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
