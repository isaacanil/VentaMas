import { Editor } from 'draft-js';
import React, { Fragment } from 'react'
import styled from 'styled-components';

import { useGetChangelogs } from '../../../../firebase/AppUpdate/useGetChangeogs'
import { MenuApp } from '../../../templates/MenuApp/MenuApp';
import { rawToEditorState } from '../../../templates/system/BlockEditor/rawToEditorState';



export const ChangelogList = () => {
    const { changelogs, error } = useGetChangelogs();

    if (error) {
        return (
            <Container>
                <Wrapper>
                    <h1>Ventamax — Notas del lanzamiento</h1>
                    <p>No se pudieron cargar las notas de la versión. Intenta nuevamente.</p>
                </Wrapper>
            </Container>
        )
    }

    return (
        <Fragment>
            <MenuApp />
            <Container>
                <Wrapper>

                    <h1>Ventamax — Notas del lanzamiento</h1>
                    <br />
                        {changelogs
                            .sort((a, b) => new Date(b?.changelog?.createdAt) - new Date(a?.changelog?.createdAt))
                            .map(({ changelog }, index) => (
                                <EditorWrapper key={changelog?.id ?? index}>
                                    <Editor editorState={rawToEditorState(changelog.content)} />
                            </EditorWrapper>
                        ))
                      
                    }
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
