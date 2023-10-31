import { Button, ButtonSize, Loader } from "@aztec/aztec-ui";
import { AccountWallet, AztecAddress, CompleteAddress } from "@aztec/aztec.js";
import { useState } from "react";
import { PrivateOracleContract } from "../../artifacts/PrivateOracle.js";
import { decodeFromBigInt, toShortAddress } from "../../scripts/util.js";
import styles from '../oracle.module.scss';
import { useReadContractStorage } from "./contract_function_form.js";

interface Props {
    oracle: PrivateOracleContract;
    wallet: AccountWallet;
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

export function Questions({ oracle, wallet, onQuestionSelected }: Props) {
    const [loading, setLoading] = useState(-1n);

    const cancelQuestion = async (request: bigint) => {
        setLoading(request);
        try {
            await oracle.methods.cancel_question(request).send().wait();
        } finally {
            setLoading(-1n);
        }
    }

    const toAddressString = (addy: any) => {
        return AztecAddress.fromBigInt(addy).toString()
    }

    const questions = useReadContractStorage({
        user: wallet.getCompleteAddress(),
        func: oracle.withWallet(wallet).methods.get_questions(),
        parseResult: (result: any[]) => (
            result.map(question => (
                {
                    request: question.request, // Question
                    requester: toAddressString(question.requester_address.address), // Requester
                    divinity: toAddressString(question.divinity_address.address), // Divinity
                })
            )
        )
    });


    const answers = useReadContractStorage({
        user: wallet.getCompleteAddress(),
        func: oracle.withWallet(wallet).methods.get_answers(),
        parseResult: (result: any[]) => (
            result.map(answer => (
                {
                    request: answer.request, // Question
                    answer: answer.answer, // Answer
                    requester: toAddressString(answer.requester.address), // Requester
                    divinity: toAddressString(answer.divinity.address), // Divinity
                    owner: toAddressString(answer.owner.address), // Owner
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
            if (elem.requester === wallet.getAddress().toString())
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