import { AztecAddress, CompleteAddress, DeployMethod, Fr } from '@aztec/aztec.js';
import { ContractArtifact } from '@aztec/foundation/abi';
import { PXE, TxReceipt } from '@aztec/types';

export async function deployContract(
  activeWallet: CompleteAddress,
  artifact: ContractArtifact,
  typedArgs: Fr[], // encode prior to passing in
  salt: Fr,
  pxe: PXE,
): Promise<TxReceipt> {
  const tx = new DeployMethod(activeWallet.publicKey, pxe, artifact, typedArgs).send({
    contractAddressSalt: salt,
  });
  await tx.wait();
  const receipt = await tx.getReceipt();
  if (receipt.contractAddress) {
    return receipt;
  } else {
    throw new Error(`Contract not deployed (${receipt.toJSON()})`);
  }
}
