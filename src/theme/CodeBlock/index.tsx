/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import ReferenceCodeBlock from '../ReferenceCodeBlock/index.js'
import CodeBlock from '@theme-init/CodeBlock'

import type { ReferenceCodeBlockProps } from '../types'

const componentWrapper = (Component: typeof CodeBlock) => {
  const WrappedComponent = (props: ReferenceCodeBlockProps) => {
    if (props.reference) {
      return (
        <ReferenceCodeBlock {...props} />
      );
    }

    return <CodeBlock {...props} />
  };

  return WrappedComponent;
};

export default componentWrapper(CodeBlock)
