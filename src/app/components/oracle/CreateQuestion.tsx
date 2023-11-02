import { Button, ButtonSize, ButtonTheme, Loader } from "@aztec/aztec-ui";
import { AztecAddress, CompleteAddress, Fr, computeAuthWitMessageHash } from "@aztec/aztec.js";
import { useState } from "react";
import { PrivateOracleContract } from "../../../artifacts/PrivateOracle.js";
import { TokenContract } from "../../../artifacts/Token.js";
import { pxe } from '../../../config.js';
import { encodeToBigInt, getWallet } from "../../../scripts/util.js";
import styles from '../../oracle.module.scss';

interface Props {
    user: CompleteAddress;
    fee: number;
    oracle: AztecAddress;
    token: AztecAddress;
    onBack: () => void;
    onError: (error: string) => void;
}

export function CreateQuestion({ user, oracle, fee, token, onBack, onError }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [question, setQuestion] = useState(`What's the ratio for fernet?`);
    const [divinity, setDivinity] = useState('');


    const approveUnshield = async (to: AztecAddress, amount: bigint) => {
        const selectedWallet = await getWallet(user, pxe);
        const tokenContract = await TokenContract.at(token, selectedWallet);

        const nonce = Fr.random();
        // We need to compute the message we want to sign and add it to the wallet as approved
        const action = tokenContract.methods.unshield(user.address, to, BigInt(amount), nonce);
        const messageHash = await computeAuthWitMessageHash(to, action.request());

        const witness = await selectedWallet.createAuthWitness(messageHash);
        await selectedWallet.addAuthWitness(witness);
        return nonce;
    }

    const createQuestion = async (question: string, divinity: string) => {
        setIsLoading(true);
        try {
            const selectedWallet = await getWallet(user, pxe);
            const oracleContract = await PrivateOracleContract.at(oracle, selectedWallet);

            // First approve the amount of tokens
            const nonce = await approveUnshield(oracle, BigInt(fee));

            const hexQuestion = encodeToBigInt(question);
            await oracleContract.methods.submit_question(new Fr(hexQuestion), AztecAddress.fromString(divinity), new Fr(nonce)).send().wait();

            onBack();
        } catch (e: any) {
            console.log(e)
            onError(`Error creating question: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Button
                className={styles.back}
                onClick={onBack}
                text={'Back'}
                size={ButtonSize.Small}
                theme={ButtonTheme.Secondary}
            />
            <div className={styles.container}>
                <div className={styles.questionContainer}>
                    <div className={styles.item}>
                        <div className={styles.label}>Question</div>
                        <input
                            onChange={e => setQuestion(e.target.value)}
                            className={styles.input}
                            type="text"
                            value={question}
                        />
                    </div>
                    <div className={styles.item}>
                        <div className={styles.label}>Divinity</div>
                        <input
                            onChange={e => setDivinity(e.target.value)}
                            className={styles.input}
                            type="text"
                            value={divinity}
                        />
                    </div>
                </div>
                <div className={styles.deployContainer}>
                    <div className={styles.warningContainer}>
                        <div className={styles.warning}>⚠️ Creating a question has a fee of {fee} <span className={styles.bold}>private</span> tokens ⚠️</div>
                    </div>
                    {isLoading ? <Loader /> : <Button onClick={() => createQuestion(question, divinity)} className={styles.actionButton} text={'Create Question'} />}
                </div>
            </div>
        </>
    )
}