import React, { useReducer } from 'react'
import CodeBlock from '@theme-init/CodeBlock'
import { useCodeblockThemeConfig } from 'docusaurus-theme-github-codeblock/client'

import { RunmeLink } from './RunmeLink.js'
import { parseReference, fetchCode, codeReducer } from './utils.js'
import { initialFetchResultState, buttonStyles } from './constants.js'
import type { ReferenceCodeBlockProps } from '../types'

const buttonBarStyles: React.CSSProperties = {
    fontSize: '.9em',
    fontWeight: 600,
    color: '#0E75DD',
    textAlign: 'right',
    paddingBottom: '13px',
    textDecoration: 'underline'
}

function ReferenceCode(props: ReferenceCodeBlockProps) {
    const [fetchResultState, fetchResultStateDispatcher] = useReducer(
        codeReducer,
        initialFetchResultState,
    )

    const codeSnippetDetails = parseReference(props.children)
    if (fetchResultState.loading !== false) {
        fetchCode(codeSnippetDetails, fetchResultStateDispatcher)
    }

    const titleMatch = props.metastring?.match(/title="(?<title>[^"]*)"/);
    const customProps = {
        ...props,
        metastring: titleMatch?.groups?.title
            ? `${props.metastring} title="${titleMatch?.groups?.title}"`
            : `${props.metastring} title="${codeSnippetDetails.title}"`,
        children: initialFetchResultState.code,
    };

    const codeblockConfig = useCodeblockThemeConfig()
    const showButtons = codeblockConfig.showGithubLink || codeblockConfig.showRunmeLink
    return (
        <div className='docusaurus-theme-github-codeblock'>
            <CodeBlock {...customProps}>{fetchResultState.code}</CodeBlock>
            {showButtons && (
                <div style={buttonBarStyles}>
                    <RunmeLink
                        reference={props.children}
                        metastring={props.metastring}
                    />
                    {codeblockConfig.showGithubLink && (
                        <a
                            href={props.children}
                            className='githubLink'
                            style={buttonStyles}
                            target="_blank"
                        >
                            {codeblockConfig.githubLinkLabel}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

export default ReferenceCode;
