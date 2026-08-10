export type BackendErrorShape = {
  code?: number | string;
  message?: string;
  details?: Record<string, string[] | string>;
};

export type BackendEnvelope<T> = {
  data: T;
  error?: BackendErrorShape;
  message?: string;
};

export type User = Record<string, unknown> & {
  account_type?: number | string;
  customerid?: number | string;
  demo_account?: boolean | number | string;
  email?: string;
  firsttime?: number | string;
  iapp_access?: number | string;
  lang?: string;
  lname?: string;
  name?: string;
  test_date_law?: string | null;
  test_date_trade?: string | null;
};

export type LoginData = {
  user: User;
  token: string;
  expires_in: number | string;
};

export type RefreshData = {
  token: string;
  expires_in: number | string;
};
