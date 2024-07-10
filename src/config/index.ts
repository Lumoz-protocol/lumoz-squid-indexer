/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { XcmAssetId } from "@polkadot/types/interfaces";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { logger } from "../utils/logger";

export type DomainConfig = {
  rpcURL: string;
  sharedConfigURL: string;
  domainID: number;
  supportedSubstrateRPCs: string;
  domainType: string;
};

export type ProcessorConfig = {
  contractAddress: string;
  gateway: string;
  rpcURL: string;
  startBlock: number;
  numberOfConfirmations: number;
};

export const enum ResourceTypes {
  FUNGIBLE = "fungible",
  NON_FUNGIBLE = "nonfungible",
  PERMISSIONED_GENERIC = "permissionedGeneric",
  PERMISSIONLESS_GENERIC = "permissionlessGeneric",
}

export type SharedConfig = {
  domains: Array<Domain>;
};

export enum DomainTypes {
  EVM = "evm",
  SUBSTRATE = "substrate",
}

export type Domain = {
  id: number;
  name: string;
  type: DomainTypes;
  bridge: string;
  feeRouter: string;
  feeHandlers: Array<FeeHandlerType>;
  handlers: Array<Handler>;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  startBlock: number;
  resources: Array<EvmResource | SubstrateResource>;
};
type Handler = {
  type: ResourceTypes;
  address: string;
};

type FeeHandlerType = {
  type: string;
  address: string;
};

export type EvmResource = {
  resourceId: string;
  type: ResourceTypes;
  address: string;
  symbol: string;
  decimals: number;
};

export type SubstrateResource = {
  resourceId: string;
  type: ResourceTypes;
  address: string;
  symbol: string;
  decimals: number;
  assetName: string;
  xcmMultiAssetId: XcmAssetId;
};

export type RpcUrlConfig = Array<{
  id: number;
  endpoint: string;
}>;

export function getProcessorConfig(): ProcessorConfig {
  const processorConfig: ProcessorConfig = {
    contractAddress: process.env.DOMAIN_BRIDGE_ADDRESS!,
    gateway: process.env.DOMAIN_GATEWAY!,
    rpcURL: process.env.RPC_URL!,
    numberOfConfirmations: Number(process.env.DOMAIN_CONFIRMATIONS),
    startBlock: Number(process.env.START_BLOCK!),
  };
  validateConfig(processorConfig);
  return processorConfig;
}

export function getDomainConfig(): DomainConfig {
  const domainConfig: DomainConfig = {
    domainID: Number(process.env.DOMAIN_ID),
    rpcURL: process.env.RPC_URL!,
    sharedConfigURL: process.env.SHARED_CONFIG_URL!,
    supportedSubstrateRPCs: process.env.SUPPORTED_SUBSTRATE_RPCS!,
    domainType: process.env.DOMAIN_TYPE!,
  };
  validateConfig(domainConfig);
  return domainConfig;
}

function validateConfig(config: Record<string, any>): void {
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`${key} is not defined or invalid`);
    }
  }
}

export const getSharedConfig = async (url: string): Promise<SharedConfig> => {
  try {
    const response = await fetch(url);
    return (await response.json()) as SharedConfig;
  } catch (e) {
    logger.error(`Failed to fetch config for ${process.env.STAGE || ""}`, e);
    return Promise.reject(e);
  }
};

export const getSsmDomainConfig = async (
  supportedRPCs: string
): Promise<Map<number, ApiPromise>> => {
  const parsedResponse = JSON.parse(supportedRPCs) as RpcUrlConfig;
  const rpcUrlMap = new Map<number, ApiPromise>();
  for (const rpcConfig of parsedResponse) {
    const wsProvider = new WsProvider(rpcConfig.endpoint);
    const api = await ApiPromise.create({
      provider: wsProvider,
    });
    rpcUrlMap.set(rpcConfig.id, api);
  }

  return rpcUrlMap;
};
