/*
The Licensed Work is (c) 2024 Sygma
SPDX-License-Identifier: LGPL-3.0-only
*/

import ERC20Contract from "@openzeppelin/contracts/build/contracts/ERC20.json";
import type { Provider } from "ethers";
import { Contract } from "ethers";

import * as FeeHandlerRouter from "../../abi/FeeHandlerRouterABI.json";

import { ContractType } from "./evmTypes";

export function getContract(
  provider: Provider,
  contractAddress: string,
  contractType: ContractType,
): Contract {
  switch (contractType) {
    case ContractType.ERC20:
      return new Contract(contractAddress, ERC20Contract.abi, provider);
    case ContractType.FEE_ROUTER:
      return new Contract(contractAddress, FeeHandlerRouter.abi, provider);
  }
}
