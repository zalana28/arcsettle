/**
 * Circle Wallets Service Types
 */

export interface CircleWallet {
  id: string;
  state: string;
  walletSetId: string;
  custodyType: string;
  address?: string;
  blockchain?: string;
  accountType?: string;
  createDate?: string;
  updateDate?: string;
}

export interface CircleWalletCreateInput {
  idempotencyKey: string;
  walletSetId?: string;
  blockchains?: string[];
  count?: number;
  accountType?: string;
  entitySecretCiphertext?: string;
}

export interface CircleWalletServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}
