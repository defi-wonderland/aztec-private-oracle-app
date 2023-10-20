import { Card, CardTheme } from "@aztec/aztec-ui";
import { AztecAddress, CompleteAddress, NotePreimage } from "@aztec/aztec.js";
import styles from './TokenMinter.module.scss';
import { useReadContractStorage } from "./contract_function_form.js";
import { toShortAddress } from "../../scripts/util.js";

interface Props {
    contractAddress: AztecAddress;
    user: CompleteAddress;
}

type Element = {
    request: string;
    requester: string;
    divinity: string;
    answer: string;
}

export function Questions({ contractAddress, user }: Props) {

    const questions = useReadContractStorage({
        wallet: user,
        contractAddress,
        storageSlot: 1,
        parseResult: (result: NotePreimage[]) => (
            result.map(question => (
                {
                    request: question.items[0].toBigInt().toString(), // Question
                    requester: question.items[1].toString(), // Requester
                    divinity: question.items[2].toString(), // Divinity
                })
            )
        )
    });

    const answers = useReadContractStorage({
        wallet: user,
        contractAddress,
        storageSlot: 2,
        parseResult: (result: NotePreimage[]) => (
            result.map(answer => (
                {
                    request: answer.items[0].toBigInt().toString(), // Question
                    answer: answer.items[1].toBigInt().toString(), // Answer
                    owner: answer.items[2].toString(), // Owner
                }
            ))
        )
    });

    const header = ['request', 'requester', 'divinity', 'answer', ''];

    const data: Element[] = questions.concat(answers).map((elem: any) => (
        {
            request: elem.request,
            requester: elem.requester || '-',
            divinity: elem.divinity || '-',
            answer: elem.answer || '-',
        }
    ));

    const status = (elem: Element) => {
        if (elem.answer === '-') {
            if (elem.requester === user.address.toString())
                return <span className={styles.badgeToBeAnswered}>To be answered</span>
            else
                return <span className={styles.badgeToAnswer}>To answer</span>
        } else {
            return <span className={styles.badgeAnswered}>Answered</span>
        }
    }

    const content =
        <div className={styles.container}>
            <table>
                <thead>
                    <tr>
                        {header.map((h, index) => <th key={index}>{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((elem, index) => (
                        <tr key={index}>
                            <td>{elem.request}</td>
                            <td>{toShortAddress(elem.requester)}</td>
                            <td>{toShortAddress(elem.divinity)}</td>
                            <td>{elem.answer}</td>
                            <td>{status(elem)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>


    return (
        <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={'Questions'} cardContent={content} />
    )
}