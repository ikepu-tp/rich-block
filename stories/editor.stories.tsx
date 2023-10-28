import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Editor, { getRichBlockDefault } from './../src/Editor';

const meta = {
	title: 'Editor',
	component: Editor,
	tags: ['autodocs'],
	argTypes: {},
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
	args: {
		content: [getRichBlockDefault({ contents: 'test' })],
	},
};
