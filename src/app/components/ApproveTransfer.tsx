import { Button, Loader } from "@aztec/aztec-ui";
import { AccountWallet, AztecAddress, CompleteAddress, Fr, computeAuthWitMessageHash } from "@aztec/aztec.js";
import { useEffect, useState } from "react";
import { TokenContract } from "../../artifacts/Token.js";
import { pxe } from '../../config.js';
import { getWallet } from "../../scripts/util.js";
import styles from './TokenMinter.module.scss';

interface Props {
    tokenAddress: AztecAddress;
    user: CompleteAddress;
    onResult: (result: string) => void;
}

export function ApproveTransfer({ tokenAddress, user, onResult }: Props) {
    const [amount, setAmount] = useState('1000');
    const [to, setTo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<TokenContract | undefined>(undefined);
    const [selectedWallet, setSelectedWallet] = useState<AccountWallet | undefined>(undefined);

    useEffect(() => {
        const loadTokenContract = async () => {
            const wallet = await getWallet(user, pxe);
            const tokenInstance = await TokenContract.at(tokenAddress, wallet);
            setToken(tokenInstance);
            setSelectedWallet(wallet);
        }
        loadTokenContract();
    }, [tokenAddress, user]);


    const approveTransfer = async () => {
        if (token && selectedWallet) {
            setIsLoading(true);
            try {
                const nonce = Fr.random();
                // We need to compute the message we want to sign and add it to the wallet as approved
                const toAddress = AztecAddress.fromString(to);
                const action = token.methods.transfer(user.address, toAddress, BigInt(amount), nonce);
                const messageHash = await computeAuthWitMessageHash(toAddress, action.request());

                const witness = await selectedWallet.createAuthWitness(messageHash);
                await selectedWallet.addAuthWitness(witness);
                onResult(`Approved transfer with nonce ${nonce}`);
            } catch (e: any) {
                onResult(`Error approving transfer: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
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
                {isLoading || !((token && selectedWallet)) ? <Loader /> : <Button onClick={approveTransfer} className={styles.actionButton} text={'Approve'} />}
            </div>
        </div>
    )
}