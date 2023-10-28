import { FormEvent, useEffect, useRef, useState } from 'react';
import { createKey } from '.';

export type RichBlockType = {
	attributes?: { [s: string]: string | number };
	contents: string;
	id: string;
	style?: { [s: string]: string | number };
	type: string;
};
export const RichBlockDefault: RichBlockType = {
	contents: '',
	id: createKey(),
	type: 'p',
};
export function getRichBlockDefault(id: string | null = null): RichBlockType {
	return {
		contents: '',
		id: id || createKey(),
		type: 'p',
	};
}
export type EditorProps = {
	content?: RichBlockType[];
	onChange?: (content: RichBlockType[]) => void;
};
export default function Editor(props: EditorProps): JSX.Element {
	const [Contents, setContents] = useState<RichBlockType[]>(props.content || [getRichBlockDefault()]);

	useEffect(() => {
		if (props.onChange) props.onChange(Contents);
		console.log(Contents[0]);
	}, [Contents]);

	function changeContent(key: number, content: RichBlockType): void {
		Contents[key] = content;
		setContents(Contents.concat());
	}
	return (
		<>
			{Contents.map(
				(content: RichBlockType, idx: number): JSX.Element => (
					<EditorItem key={content.id} content={content} idx={idx} changeContent={changeContent} />
				)
			)}
		</>
	);
}
export type EditorItemProps = {
	content: RichBlockType;
	idx: number;
	changeContent: (key: number, content: RichBlockType) => void;
};
export function EditorItem(props: EditorItemProps): JSX.Element {
	const Content = useRef<string>(props.content.contents);

	function onInput(e: FormEvent<HTMLDivElement>): void {
		props.changeContent(props.idx, { ...props.content, contents: e.currentTarget.textContent || '' });
	}
	return (
		<div contentEditable onInput={onInput}>
			{Content.current}
		</div>
	);
}
