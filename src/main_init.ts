/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/
import { ResourceType } from "@buildwithsygma/core";
import type { EntityManager } from "typeorm";

import type { Domain as DomainConfig } from "./indexer/config";
import { fetchSharedConfig } from "./indexer/config";
import { getDomainMetadata, getEnv } from "./indexer/config/envLoader";
import { Domain, Resource, Token } from "./model";
import { initDatabase } from "./utils";

const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function init(): Promise<void> {
  const envVars = getEnv();
  const dataSource = await initDatabase(envVars.dbConfig);
  const sharedConfig = await fetchSharedConfig(envVars.sharedConfigURL);

  await insertDomains(
    sharedConfig.domains,
    dataSource.manager,
    envVars.envDomains,
  );
  await dataSource.destroy();
}

async function insertDomains(
  domains: Array<DomainConfig>,
  manager: EntityManager,
  supportedDomainsIDs: number[],
): Promise<void> {
  for (const domainID of supportedDomainsIDs) {
    const domain = domains.find((domain) => domain.id == domainID);
    if (!domain) {
      throw new Error(`domain with id ${domainID} not found in shared-config`);
    }
    const domainMetadata = getDomainMetadata(domain.id.toString());
    await manager.upsert(
      Domain,
      {
        id: domain.id.toString(),
        type: domain.type,
        name: domain.name,
        iconURL: domainMetadata.iconUrl ?? "",
        explorerURL: domainMetadata.explorerUrl ?? "",
      },
      ["id"],
    );
    await manager.upsert(
      Token,
      {
        decimals: domain.nativeTokenDecimals,
        tokenSymbol: domain.nativeTokenSymbol,
        tokenAddress: NATIVE_TOKEN_ADDRESS,
        domainID: domain.id.toString(),
      },
      ["tokenAddress", "domainID"],
    );

    for (const r of domain.resources) {
      const resource = {
        id: r.resourceId.toLowerCase(),
        type: r.type,
      };
      await manager.upsert(Resource, resource, ["id"]);
      if (r.type == ResourceType.PERMISSIONLESS_GENERIC) {
        continue;
      }
      const token = {
        decimals: r.decimals,
        tokenSymbol: r.symbol,
        tokenAddress:
          "address" in r ? r.address : JSON.stringify(r.xcmMultiAssetId),
        domainID: domain.id.toString(),
        resourceID: r.resourceId,
      };
      await manager.upsert(Token, token, ["tokenAddress", "domainID"]);
    }
  }
}
