import React, { Fragment } from 'react'
import { useGetChangelogs } from '../../../../firebase/AppUpdate/useGetChangeogs'
import { Editor } from 'draft-js';
import { rawToEditorState } from '../../../templates/system/BlockEditor/rawToEditorState';
import styled from 'styled-components';
import { MenuApp } from '../../../templates/MenuApp/MenuApp';

export const ChangelogList = () => {
    const { changelogs, error } = useGetChangelogs();
    console.log(changelogs)
    return (
        <Fragment>
            <MenuApp />
            <Container>
                <Wrapper>

                    <h1>Ventamax — Notas del lanzamiento</h1>
                    {changelogs.map(({ changelog }, index) => (
                        <EditorWrapper>
                            <Editor key={index} editorState={rawToEditorState(changelog.content)} />

                        </EditorWrapper>
                    ))}
                </Wrapper>
            </Container>
        </Fragment>
    )
}
const Container = styled.div`
    width: 100%;
    height: calc(100vh - 2.75em);

`
const Wrapper = styled.div`
    padding: 1em;
    max-width: 900px;
    width: 100%;
    overflow: auto;
    margin: 0 auto;
    h1{
        margin-left: 0;
    }
    h2{
        margin-left: 0;
    }
`
const EditorWrapper = styled.div`
    margin-bottom: 6em;
    :last-child{
        margin-bottom: 0;
    }
`