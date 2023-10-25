import { Button, ButtonSize, ButtonTheme, Loader } from "@aztec/aztec-ui";
import { AztecAddress } from "@aztec/aztec.js";
import { useState } from "react";
import { PrivateOracleContract } from "../../../artifacts/PrivateOracle.js";
import { decodeFromBigInt, encodeToBigInt } from "../../../scripts/util.js";
import styles from '../../oracle.module.scss';

interface Props {
    question: bigint | undefined;
    requester: AztecAddress | undefined;
    fee: number;
    oracle: PrivateOracleContract;
    onBack: () => void;
    onError: (error: string) => void;
}

export function AnswerQuestion({ question, requester, oracle, fee, onBack, onError }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [answer, setAnswer] = useState('70/30 of course');

    const answerQuestion = async () => {
        if (question && requester) {
            setIsLoading(true);
            try {
                const hexAnswer = encodeToBigInt(answer);
                await oracle.methods.submit_answer(question, requester, hexAnswer).send().wait();
                onBack();
            } catch (e: any) {
                console.log(e)
                onError(`Error answering question: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
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
                        {question ? <input
                            className={styles.input}
                            disabled
                            type="text"
                            value={decodeFromBigInt(question)}
                        /> :
                            <Loader />
                        }
                    </div>
                    <div className={styles.item}>
                        <div className={styles.label}>Answer</div>
                        <input
                            onChange={e => setAnswer(e.target.value)}
                            className={styles.input}
                            type="text"
                            value={answer}
                        />
                    </div>
                </div>
                <div className={styles.deployContainer}>
                    {(isLoading && question && requester) ? <Loader /> : <Button onClick={answerQuestion} className={styles.actionButton} text={'Answer Question'} />}
                </div>
            </div>
        </>
    )
}