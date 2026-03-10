export type PublicUser = {
  accountId: string;
  displayName: string;
};

export type LoginResponse = {
  token: string;
  user: PublicUser;
};
