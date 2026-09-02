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
  address?: string | null;
  city?: string | null;
  created_platform?: number | string;
  enrollment_agreements?: {
    Agreement_body?: string | null;
    id?: number | string | null;
  } | null;
  iapp_access?: number | string;
  lang?: string;
  lname?: string;
  mobilenum?: string | null;
  name?: string;
  question_feedback_disabled?: boolean | number | string;
  state?: string | null;
  test_date_law?: string | null;
  test_date_trade?: string | null;
  zip?: string | null;
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
