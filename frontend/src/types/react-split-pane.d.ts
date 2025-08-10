declare module 'react-split-pane' {
  import * as React from 'react';

  export type Split = 'vertical' | 'horizontal';

  export interface SplitPaneProps {
    split?: Split;
    minSize?: number | string;
    defaultSize?: number | string;
    allowResize?: boolean;
    onChange?: (size: number) => void;
    onDragFinished?: () => void;
    className?: string;
    style?: React.CSSProperties;
  }

  export default class SplitPane extends React.Component<React.PropsWithChildren<SplitPaneProps>> {}
}


