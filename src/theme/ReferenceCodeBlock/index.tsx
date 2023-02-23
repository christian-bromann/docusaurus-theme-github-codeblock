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

const USER_ANGENT = (
    navigator.userAgent ||
    navigator.vendor ||
    // @ts-expect-error
    window.opera
)
const REGEX_MOBILE_DEVICE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i
const REGEX_VENDOR = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i
function detectMobile () {
    return REGEX_MOBILE_DEVICE.test(USER_ANGENT) || REGEX_VENDOR.test(USER_ANGENT.substr(0, 4))
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

export function getRunmeLink (snippetUrl: string, metastring: string) {
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
    const showRunmeButton = !detectMobile() && codeblockConfig.showRunmeLink && props.metastring
    return (
        <div className='docusaurus-theme-github-codeblock'>
            <CodeBlock {...customProps}>{fetchResultState.code}</CodeBlock>
            {showButtons && (
                <div style={buttonBarStyles}>
                    {showRunmeButton && (
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
