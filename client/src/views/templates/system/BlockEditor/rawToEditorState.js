import { convertFromRaw, EditorState } from 'draft-js';

export const rawToEditorState = (rawContent) => {
    try {
        const parsedChangelog = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        const contentState = convertFromRaw(parsedChangelog);
        return EditorState.createWithContent(contentState);
    } catch (error) {
        console.error('Failed to convert raw content to EditorState:', error);
        return EditorState.createEmpty();
    }
};