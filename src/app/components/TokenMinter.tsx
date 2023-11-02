import { Button, Card, CardTheme, Loader } from "@aztec/aztec-ui";
import { AztecAddress, CompleteAddress, ExtendedNote, Fr, Note, TxHash, computeMessageSecretHash } from "@aztec/aztec.js";
import { useState } from "react";
import { pxe, tokenArtifact } from '../../config.js';
import { callContractFunction } from "../../scripts/call_contract_function.js";
import { convertArgs, getWallet } from "../../scripts/util.js";
import styles from './TokenMinter.module.scss';

interface Props {
    token: AztecAddress;
    minter: CompleteAddress;
    onResult: (result: string) => void;
}

export function TokenMinter({ token, minter, onResult }: Props) {
    const [amount, setAmount] = useState('1000');
    const [to, setTo] = useState(minter.address.toString() as string);
    const [isLoading, setIsLoading] = useState(false);

    const addPendingShieldNoteToPXE = async (account: CompleteAddress, amount: bigint, secretHash: Fr, txHash: TxHash) => {
        const storageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
        const preimage = new Note([new Fr(amount), secretHash]);
        await pxe.addNote(new ExtendedNote(preimage, account.address, token, storageSlot, txHash));
    };

    const mintTokens = async () => {
        setIsLoading(true);
        try {
            const secret = Fr.random();
            const secretHash = await computeMessageSecretHash(secret);

            // mintPrivate
            const mintPrivate = 'mint_private';
            const mintPrivateAbi = tokenArtifact.functions.find(f => f.name === mintPrivate)!;
            const typedMintPrivateArgs: any[] = convertArgs(mintPrivateAbi, { amount: amount, secret_hash: secretHash });
            const receipt = await callContractFunction(token, tokenArtifact, mintPrivate, typedMintPrivateArgs, pxe, minter)

            // add to PXE
            await addPendingShieldNoteToPXE(minter, BigInt(amount), secretHash, receipt.txHash);

            // redeemShield
            const redeemShield = 'redeem_shield';
            const redeemShieldAbi = tokenArtifact.functions.find(f => f.name === redeemShield)!;
            const receiver = CompleteAddress.fromString(to);
            const typedRedeemShieldArgs: any[] = convertArgs(redeemShieldAbi, { to: receiver, amount: BigInt(amount), secret: secret });
            await callContractFunction(token, tokenArtifact, redeemShield, typedRedeemShieldArgs, pxe, minter)
            onResult(`Succesfully minted ${amount} tokens to ${to}`)
        } catch (e: any) {
            onResult(`Error minting tokens: ${e.message}`)
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.item}>
                <div className={styles.label}>amount</div>
                <input
                    onChange={e => setAmount(e.target.value)}
                    className={styles.input}
                    type="text"
                    value={amount}
                />
            </div>
            <div className={styles.item}>
                <div className={styles.label}>to</div>
                <input
                    onChange={e => setTo(e.target.value)}
                    className={styles.input}
                    type="text"
                    value={to}
                />
            </div>
            <div className={styles.mint}>
                {isLoading ? <Loader /> : <Button onClick={mintTokens} className={styles.actionButton} text={'Mint'} />}
            </div>
        </div>
    )
}