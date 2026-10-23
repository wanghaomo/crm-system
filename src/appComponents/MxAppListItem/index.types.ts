export interface IActionItem {
  text: string;
  type?: string;
  plain?: boolean;
  textColor?: string;
  borderColor?: string;
  [key: string]: any;
}

export interface IStatusConfig {
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
  color?: string;
  /** AppTag 预设类型：primary | warning | error | success | info */
  type?: string;
}

export interface IMxAppListItemProps {
  title?: string;
  statusConfig?: IStatusConfig;
  actions?: IActionItem[];
}

export interface IMxAppListItemEmits {
  (e: 'click'): void;
  (e: 'action', btn: IActionItem, index: number): void;
}
