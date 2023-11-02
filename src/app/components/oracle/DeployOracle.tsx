import { Button, Card, CardTheme, Loader } from "@aztec/aztec-ui";
import { AccountWallet, AztecAddress, Fr, TxHash } from "@aztec/aztec.js";
import { useState } from "react";
import { PrivateOracleContract } from "../../../artifacts/PrivateOracle.js";
import { TokenContract } from "../../../artifacts/Token.js";
import styles from '../../oracle.module.scss';

interface Props {
    wallet: AccountWallet | undefined;
    onDeploy: (oracleAddress: AztecAddress, tokenAddress: AztecAddress, fee: number, txHash: TxHash) => void;
    onError: (error: string) => void;
}

export function DeployOracle({ wallet, onDeploy, onError }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [fee, setFee] = useState(1000);

    const deployOracle = async (fee: number) => {
        if (!wallet) return;
        setIsLoading(true);
        try {
            // Deploy token
            const token = await TokenContract.deploy(wallet, wallet.getCompleteAddress()).send().wait();
            // Deploy oracle
            const oracle = await PrivateOracleContract.deploy(wallet, token.contractAddress!, new Fr(fee)).send().wait();

            onDeploy(oracle.contractAddress!, token.contractAddress!, fee, oracle.txHash);
        } catch (e: any) {
            onError(`Error deploying oracle: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    const header = 'Deploy Oracle'

    const content = (
        <div className={styles.container}>
            <div className={styles.item}>
                <div className={styles.label}>Fee</div>
                <input
                    onChange={e => setFee(Number(e.target.value))}
                    className={styles.input}
                    type="number"
                    value={fee}
                />
            </div>
            <div className={styles.deployContainer}>
                {isLoading ? <Loader /> : <Button onClick={() => deployOracle(fee)} className={styles.actionButton} text={'Deploy'} />}
            </div>
        </div>
    )


    return (
        <Card cardTheme={CardTheme.DARK} cardHeader={header} cardContent={content} />
    )
}