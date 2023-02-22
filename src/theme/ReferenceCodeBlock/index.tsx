import React, { useReducer } from 'react'
import CodeBlock from '@theme-init/CodeBlock'
import { useCodeblockThemeConfig } from 'docusaurus-theme-github-codeblock/client'

import type { ReferenceCodeBlockProps, GitHubReference, DispatchMessage } from '../types'

const initialFetchResultState = {
    code: 'loading...',
    error: null,
    loading: null,
}

const buttonBarStyles: React.CSSProperties = {
    fontSize: '.9em',
    fontWeight: 600,
    color: '#0E75DD',
    textAlign: 'right',
    paddingBottom: '13px',
    textDecoration: 'underline'
}

const buttonStyles: React.CSSProperties = {
    margin: '0 10px'
}

/**
 * parses GitHub reference
 * @param {string} ref url to github file
 */
export function parseReference (ref: string): GitHubReference {
    const fullUrl = ref.slice(ref.indexOf('https'))
    const [url, loc] = fullUrl.split('#')

    /**
     * webpack causes failures when it tries to render this page
     */
    const [org, repo, blob, branch, ...pathSeg] = new global.URL(url).pathname.split('/').slice(1)
    const [fromLine, toLine] = loc
        ? loc.split('-').map((lineNr) => parseInt(lineNr.slice(1), 10) - 1)
        : [0, Infinity]

    return {
        url: `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${pathSeg.join('/')}`,
        fromLine,
        toLine,
        title: pathSeg.join('/'),
        org,
        repo
    }
}

async function fetchCode ({ url, fromLine, toLine }: GitHubReference, fetchResultStateDispatcher: React.Dispatch<DispatchMessage>) {
    let res: Response

    try {
        res = await fetch(url)
    } catch (err) {
        return fetchResultStateDispatcher({ type: 'error', value: err as Error })
    }

    if (res.status !== 200) {
        const error = await res.text()
        return fetchResultStateDispatcher({ type: 'error', value: error })
    }

    const body = (await res.text()).split('\n').slice(fromLine, (toLine || fromLine) + 1)
    const preceedingSpace = body.reduce((prev: number, line: string) => {
        if (line.length === 0) {
            return prev
        }

        const spaces = line.match(/^\s+/)
        if (spaces) {
            return Math.min(prev, spaces[0].length)
        }

        return 0
    }, Infinity)

    return fetchResultStateDispatcher({
        type: 'loaded',
        value: body.map((line) => line.slice(preceedingSpace)).join('\n')
    })
}

export function codeReducer (prevState: any, { type, value }: DispatchMessage) {
    switch (type) {
        case 'reset': {
        return initialFetchResultState;
        }
        case 'loading': {
        return {...prevState, loading: true};
        }
        case 'loaded': {
        return {...prevState, code: value, loading: false};
        }
        case 'error': {
        return {...prevState, error: value, loading: false};
        }
        default:
        return prevState;
    }
}

function getRunmeLink (snippetUrl: string, metastring?: string) {
    if (!metastring) {
        return
    }

    const params = new URLSearchParams({ command: 'setup' });
    const runmeRepositoryMatch = metastring.match(/runmeRepository="(?<repository>[^"]*)"/);
    const runmeFileToOpenMatch = metastring.match(/runmeFileToOpen="(?<fileToOpen>[^"]*)"/);

    if (snippetUrl.endsWith('.md')) {
        params.set('fileToOpen', parseReference(snippetUrl).url)
        return params.toString()
    }

    if (runmeFileToOpenMatch?.groups?.fileToOpen) {
        params.set('fileToOpen', runmeFileToOpenMatch.groups.fileToOpen)

        if (runmeRepositoryMatch?.groups?.repository) {
            params.set('repository', runmeRepositoryMatch.groups.repository)
        }

        return params.toString()
    }

    const { org, repo, title } = parseReference(snippetUrl)
    params.set('repository', `git@github.com:${org}/${repo}.git`)
    params.set('fileToOpen', title.split('/').slice(0, -1).join('/') + '/README.md')
    return params.toString()
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
            ? ` title="${titleMatch?.groups?.title}"`
            : ` title="${codeSnippetDetails.title}"`,
        children: initialFetchResultState.code,
    };

    const codeblockConfig = useCodeblockThemeConfig()
    const showButtons = codeblockConfig.showGithubLink || codeblockConfig.showRunmeLink
    return (
        <div className='docusaurus-theme-github-codeblock'>
            <CodeBlock {...customProps}>{fetchResultState.code}</CodeBlock>
            {showButtons && (
                <div style={buttonBarStyles}>
                    {codeblockConfig.showRunmeLink && (
                        <a
                            href={`vscode://stateful.runme?${getRunmeLink(props.children, props.metastring)}`}
                            className='runmeLink'
                            target="_blank"
                            style={buttonStyles}
                        >
                                {codeblockConfig.runmeLinkLabel}
                        </a>
                    )}
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
