import React from 'react';
import Typography from "../Typografy/Typografy";
import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';

const renderText = (parsedText) => {
  return parsedText.map((block, index) => {
    const externalLink = block.fragments.find((fragment) => fragment.link && (fragment.url.startsWith('http') || fragment.url.startsWith('www')));
    if (block.type === 'p') {
      return (
        <Typography variant="body1" key={index}>
          {block.fragments.map((fragment, fIndex) => (
            <Fragment>
              {fragment.link ? (
                externalLink ? (
                  <Typography
                    display="inline"
                    component={'a'}
                    href={fragment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={fIndex}
                  >
                    {fragment.text}
                  </Typography>
                ) : (
                  <Typography
                    display="inline"
                    component={NavLink}
                    to={fragment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={fIndex}
                  >
                    {fragment.text}
                  </Typography>
                )) : (
                <Typography
                  display="inline"
                  variant={fragment.type}
                  underline={fragment.underline}
                  bold={fragment.bold}
                  italic={fragment.italic}
                  strikethrough={fragment.strikethrough}
                  key={fIndex}
                >
                  {fragment.text}
                </Typography>
              )}
            </Fragment>
          ))}
        </Typography>
      );
    }
  });
};

export default renderText;