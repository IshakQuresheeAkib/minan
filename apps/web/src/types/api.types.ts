export type ApiSuccess<TData> = {
  data: TData;
};

export type ApiList<TItem> = {
  data: TItem[];
  total: number;
};
