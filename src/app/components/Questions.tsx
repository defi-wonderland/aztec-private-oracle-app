import { Button, ButtonSize, Loader } from "@aztec/aztec-ui";
import { CompleteAddress, NotePreimage } from "@aztec/aztec.js";
import { useState } from "react";
import { PrivateOracleContract } from "../../artifacts/PrivateOracle.js";
import { decodeFromBigInt, toShortAddress } from "../../scripts/util.js";
import styles from '../oracle.module.scss';
import { useReadContractStorage } from "./contract_function_form.js";

interface Props {
    oracle: PrivateOracleContract;
    user: CompleteAddress;
    onQuestionSelected: (question: QuestionElement) => void;
}

export type QuestionElement = {
    request: bigint;
    requester: string;
    divinity: string;
    answer: bigint | undefined;
}

const QUESTION_STORAGE_SLOT = 3;
const ANSWER_STORAGE_SLOT = 4;

export function Questions({ oracle, user, onQuestionSelected }: Props) {
    const [loading, setLoading] = useState(-1n);

    const cancelQuestion = async (request: bigint) => {
        setLoading(request);
        try {
            await oracle.methods.cancel_question(request).send().wait();
        } finally {
            setLoading(-1n);
        }
    }

    const questions = useReadContractStorage({
        wallet: user,
        contractAddress: oracle.address,
        storageSlot: QUESTION_STORAGE_SLOT,
        parseResult: (result: NotePreimage[]) => (
            result.map(question => (
                {
                    request: question.items[0].toBigInt(), // Question
                    requester: question.items[1].toString(), // Requester
                    divinity: question.items[2].toString(), // Divinity
                })
            )
        )
    });

    const answers = useReadContractStorage({
        wallet: user,
        contractAddress: oracle.address,
        storageSlot: ANSWER_STORAGE_SLOT,
        parseResult: (result: NotePreimage[]) => (
            result.map(answer => (
                {
                    request: answer.items[0].toBigInt(), // Question
                    answer: answer.items[1].toBigInt(), // Answer
                    requester: answer.items[2].toString(), // Requester
                    divinity: answer.items[3].toString(), // Divinity
                    owner: answer.items[4].toString(), // Owner
                }
            ))
        )
    });

    const header = ['request', 'requester', 'divinity', 'answer', ''];

    const data: QuestionElement[] = questions.concat(answers).map((elem: any) => (
        {
            request: elem.request,
            requester: elem.requester,
            divinity: elem.divinity,
            answer: elem.answer,
        }
    ));

    const status = (elem: QuestionElement) => {
        if (!elem.answer) {
            if (elem.requester === user.address.toString())
                return (loading === elem.request) ?
                    <Loader className={styles.cancelLoader}/> :
                    <Button size={ButtonSize.Small} className={styles.badgeCancel} text={'Cancel'} onClick={() => cancelQuestion(elem.request)} />
            else
                return <Button size={ButtonSize.Small} className={styles.badgeToAnswer} text={'Answer'} onClick={() => onQuestionSelected(elem)} />
        } else {
            return <></>
        }
    }

    return (
        <div className={styles.container}>
            <table>
                <thead>
                    <tr>
                        {header.map((h, index) => <th key={index}>{h}</th>)}
                    </tr>
                </thead>

                <tbody>
                    {
                        data.map((elem, index) => (
                            <tr key={index}>
                                <td>{elem.request ? decodeFromBigInt(elem.request) : '-'}</td>
                                <td>{toShortAddress(elem.requester || '-')}</td>
                                <td>{toShortAddress(elem.divinity || '-')}</td>
                                <td>{elem.answer ? decodeFromBigInt(elem.answer) : '-'}</td>
                                <td className={styles.questionStatus}>{status(elem)}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}