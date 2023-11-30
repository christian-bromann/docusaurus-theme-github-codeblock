import { initialFetchResultState } from './constants'
import type { GitHubReference, DispatchMessage } from '../types'

/**
 * parses GitHub reference
 * @param {string} ref url to github file
 */
export function parseReference(ref: string): GitHubReference {
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

export async function fetchCode({ url, fromLine, toLine }: GitHubReference, fetchResultStateDispatcher: React.Dispatch<DispatchMessage>) {
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

    if (body.length === 0) {
        return fetchResultStateDispatcher({
            type: 'error',
            value: `Error: No code found at ${url} from line ${fromLine} to line ${toLine}`
        })
    }

    return fetchResultStateDispatcher({
        type: 'loaded',
        value: body.map((line) => line.slice(preceedingSpace)).join('\n')
    })
}

export function codeReducer(prevState: any, { type, value }: DispatchMessage) {
    switch (type) {
        case 'reset': {
            return initialFetchResultState;
        }
        case 'loading': {
            return { ...prevState, loading: true };
        }
        case 'loaded': {
            return { ...prevState, code: value, loading: false };
        }
        case 'error': {
            return { ...prevState, code: value, loading: false };
        }
        default:
            return prevState;
    }
}
