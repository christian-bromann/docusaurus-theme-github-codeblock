/**
 * Copyright (c) 2023 Christian Bromann
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default () => ({
    name: 'docusaurus-theme-github-codeblock',

    getThemePath() {
        return path.resolve(__dirname, './theme')
    }
})
