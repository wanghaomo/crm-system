export interface IDescriptionItem {
  label: string;
  value?: string | number;
  colSpan?: number;
  [key: string]: any;
}

export interface IMxAppDescriptionsProps {
  data: IDescriptionItem[];
  column?: number;
  labelWidth?: string;
  labelAlign?: 'left' | 'center' | 'right' | 'justify';
  valueAlign?: 'left' | 'center' | 'right';
  gutter?: number | string;
  emptyText?: string;
}
