// // parseText.js
// // parseText.js
// import marked from 'marked';

const parseText = (text) => {
    const styles = [
        { regex: /__(.*?)__/, style: 'underline' },
        { regex: /~~(.*?)~~/, style: 'strikethrough' },
        { regex: /\*\*(.*?)\*\*/, style: 'bold' },
        { regex: /(?<!_)_([^_]+)_(?!_)/, style: 'italic' },
        { regex: /`(.*?)`/, style: 'code' },
        { regex: /\[(.*?)\]\((.*?)\)/, style: 'link' },
        { regex: /!\[(.*?)\]\((.*?)\)/, style: 'image' },
    ];

    return text.split('\n').map((line) => {
        let remaining = line;
        const fragments = [];

        while (remaining) {
            const nextMatch = styles.reduce(
                (acc, { regex, style }) => {
                    const match = remaining.match(regex);
                    if (match) {
                        const index = remaining.indexOf(match[0]);
                        if (index < acc.index) {
                            return { index, match, style };
                        }
                    }
                    return acc;
                },
                { index: Infinity }
            );

            const { index, match, style } = nextMatch;

            if (index === Infinity) {
                fragments.push({ type: 'span', text: remaining });
                break;
            }

            if (index > 0) {
                fragments.push({ type: 'span', text: remaining.substring(0, index) });
            }

            const fragment = { type: 'span', text: match[1], [style]: true };

            if (style === 'link') {
                fragment.url = match[2];
            }

            fragments.push(fragment);

            remaining = remaining.substring(index + match[0].length);
        }

        return { type: 'p', fragments };
    });
};


export default parseText;
