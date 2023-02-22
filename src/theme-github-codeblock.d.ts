/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module 'docusaurus-theme-github-codeblock' {
    export type ThemeConfig = {
        codeblock: {
            showGithubLink: boolean
            githubLinkLabel: string
            showRunmeLink: boolean
            runmeLinkLabel: string
        }
    }
}

declare module 'docusaurus-theme-github-codeblock/client' {
    import type { ThemeConfig } from 'docusaurus-theme-github-codeblock';
    export function useCodeblockThemeConfig(): ThemeConfig['codeblock'];
}
