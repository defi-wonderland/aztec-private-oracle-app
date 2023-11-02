import { useEffect, useState } from "react";
import { TokenContract } from "../../artifacts/Token.js";
import { AztecAddress, CompleteAddress, Fr } from "@aztec/circuits.js";
import styles from './TokenBalance.module.scss';
import { Button, ButtonSize, ButtonTheme, Loader } from "@aztec/aztec-ui";
import { ExtendedNote, Note, TxHash } from "@aztec/types";
import { AccountWallet, computeMessageSecretHash } from "@aztec/aztec.js";

interface Props {
    token: TokenContract;
    wallet: AccountWallet;
    onResult: (str: string) => void;
}

export function TokenBalance({ token, wallet, onResult }: Props) {
    const wait = 1000; // 1 second
    const amount = 1000;

    const [privateBalance, setPrivateBalance] = useState<string | undefined>();
    const [publicBalance, setPublicBalance] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);

    const update = async () => {
        const privateBalance: bigint = await token.methods.balance_of_private(wallet.getAddress()).view();
        const publicBalance: bigint = await token.methods.balance_of_public(wallet.getAddress()).view();
        setPrivateBalance(privateBalance.toString());
        setPublicBalance(publicBalance.toString());
    }

    useEffect(() => {
        setPrivateBalance(undefined);
        setPublicBalance(undefined);
        update();
        const interval = setInterval(() => update(), wait)
        return () => {
            clearInterval(interval);
        }
    }, [wallet])

    const addPendingShieldNoteToPXE = async (amount: bigint, secretHash: Fr, txHash: TxHash) => {
        const storageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
        const preimage = new Note([new Fr(amount), secretHash]);
        await wallet.addNote(new ExtendedNote(preimage, wallet.getAddress(), token.address, storageSlot, txHash));
    };

    const mintTokens = async () => {
        setIsLoading(true);
        try {
            const secret = Fr.random();
            const secretHash = await computeMessageSecretHash(secret);

            // mintPrivate
            const receipt = await token.methods.mint_private(amount, secretHash).send().wait();

            // add to PXE
            await addPendingShieldNoteToPXE(BigInt(amount), secretHash, receipt.txHash);

            // redeemShield
            await token.methods.redeem_shield(wallet.getAddress(), amount, secret).send().wait();
            onResult(`Succesfully minted ${amount} tokens to ${wallet.getAddress()}`)
        } catch (e: any) {
            onResult(`Error minting tokens: ${e.message}`)
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className={styles.tokenBalanceContainer}>
            <div className={styles.tokenBalance}>
                <div className={styles.mintButtonContainer}>
                    {
                        isLoading ?
                            <Loader /> :
                            <Button
                                className={styles.mintButton}
                                onClick={mintTokens}
                                text={'Mint'}
                                size={ButtonSize.Small}
                                theme={ButtonTheme.Primary} />
                    }
                </div>
                <span className={styles.balanceDisplay}>
                    Private balance: {privateBalance ? privateBalance : '-'}
                </span>
            </div>
            <div className={styles.tokenBalance}>

                <span className={styles.balanceDisplay}>
                    Public balance: {publicBalance ? publicBalance : '-'}
                </span>
            </div>
        </div>
    )
}