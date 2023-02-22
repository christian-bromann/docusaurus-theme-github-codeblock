import { parseReference, codeReducer, getRunmeLink } from '../src/theme/ReferenceCodeBlock/index'

const exampleLink = 'https://github.com/christian-bromann/docusaurus-theme-github-codeblock/blob/main/src/theme/ReferenceCodeBlock/index.tsx'

test('should parse GitHub reference properly', () => {
    expect(parseReference(exampleLink)).toMatchSnapshot()
    expect(parseReference(`${exampleLink}#L105-L108`)).toMatchSnapshot()
})

test('codeReducer', () => {
    const prevState = { foo: 'bar' }
    expect(codeReducer(prevState, { type: 'reset', value: '' })).toMatchSnapshot()
    expect(codeReducer(prevState, { type: 'loading', value: '' })).toMatchSnapshot()
    expect(codeReducer(prevState, { type: 'loaded', value: 'foobar' })).toMatchSnapshot()
    expect(codeReducer(prevState, { type: 'error', value: 'ups' })).toMatchSnapshot()
    // @ts-expect-error
    expect(codeReducer(prevState, { type: 'unknown', value: '' })).toEqual(prevState)
})

test('getRunmeLink', () => {
    expect(getRunmeLink(exampleLink, '')).toMatchSnapshot()
    expect(getRunmeLink(exampleLink, 'runmeFileToOpen="foobar" title="barfoo"')).toMatchSnapshot()
    expect(getRunmeLink(exampleLink, 'runmeRepository="foobar" title="barfoo" runmeFileToOpen="foofoo"')).toMatchSnapshot()
})
