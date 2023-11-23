import { Button, ButtonSize, ButtonTheme, Card, CardTheme } from '@aztec/aztec-ui';
import { AccountWallet, AztecAddress, CompleteAddress, ExtendedNote, Fr, Note, TxHash } from '@aztec/aztec.js';
import { useEffect, useState } from 'react';
import { PrivateOracleContract } from '../artifacts/PrivateOracle.js';
import { TokenContract } from '../artifacts/Token.js';
import { pxe } from '../config.js';
import { getWallet } from '../scripts/util.js';
import { QuestionElement, Questions } from './components/Questions.js';
import { TokenBalance } from './components/TokenBalance.js';
import { AnswerQuestion } from './components/oracle/AnswerQuestion.js';
import { CreateQuestion } from './components/oracle/CreateQuestion.js';
import { DeployOracle } from './components/oracle/DeployOracle.js';
import styles from './oracle.module.scss';

enum Status {
    Questions,
    NewQuestion,
    AnswerQuestion,
}

interface Props {
    user: CompleteAddress;
    setError: (error: string) => void;
    setResult: (result: string) => void;
}

let ORACLE: AztecAddress | undefined;
let TOKEN: AztecAddress | undefined;
let FEE: number | undefined;
let TX_HASH: TxHash | undefined;

export function Oracle({ user, setError, setResult }: Props) {
    ORACLE = process.env.ORACLE ? AztecAddress.fromString(process.env.ORACLE) : undefined;
    TOKEN = process.env.TOKEN ? AztecAddress.fromString(process.env.TOKEN) : undefined;
    FEE = process.env.FEE ? parseInt(process.env.FEE) : undefined;
    TX_HASH = process.env.TX_HASH ? TxHash.fromString(process.env.TX_HASH) : undefined;

    const [oracleAddress, setOracleAddress] = useState<AztecAddress | undefined>(ORACLE);
    const [tokenAddress, setTokenAddress] = useState<AztecAddress | undefined>(TOKEN);
    const [fee, setFee] = useState<number | undefined>(FEE);
    const [txHash, setTxHash] = useState<TxHash | undefined>(TX_HASH);

    const [oracleContract, setOracleContract] = useState<PrivateOracleContract | undefined>();
    const [tokenContract, setTokenContract] = useState<TokenContract | undefined>();
    const [wallet, setWallet] = useState<AccountWallet | undefined>();

    const [status, setStatus] = useState(Status.Questions);
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionElement | undefined>()

    const isDeployed = oracleAddress && tokenAddress && fee && txHash;
    const isContractsInited = oracleContract && tokenContract;

    const onBack = () => {
        setStatus(Status.Questions);
        setSelectedQuestion(undefined);
    }

    const onQuestionSelected = (question: QuestionElement) => {
        setSelectedQuestion(question);
        setStatus(Status.AnswerQuestion);
    }

    useEffect(() => {
        const initContracts = async () => {
            const selectedWallet = await getWallet(user, pxe);
            setWallet(selectedWallet);
            if (isDeployed) {
                const oracleContract = await PrivateOracleContract.at(oracleAddress, selectedWallet);
                const tokenContract = await TokenContract.at(tokenAddress, selectedWallet);
                await pxe.registerRecipient(oracleContract.completeAddress);
                setOracleContract(oracleContract);
                setTokenContract(tokenContract);
            }
        }
        initContracts();
    }, [user, isDeployed]);

    const onDeploy = (oracleAddress: AztecAddress, tokenAddress: AztecAddress, fee: number, txHash: TxHash) => {
        console.log('Oracle deployed at:', oracleAddress.toString());
        console.log('Token deployed at:', tokenAddress.toString());
        console.log('Fee:', fee);
        console.log('Tx hash:', txHash.toString());
        setOracleAddress(oracleAddress);
        setTokenAddress(tokenAddress);
        setFee(fee);
        setTxHash(txHash);
        setResult(`Oracle deployed at: ${oracleAddress.toShortString()}`);
    };

    const handleResult = (returnValues: any) => {
        // TODO: serialize returnValues to string according to the returnTypes defined in the function abi.
        setResult(`Return values: ${returnValues}`);
    };

    const handleClosePopup = () => {
        setResult('');
        setError('');
    };

    useEffect(() => {
        if (isDeployed) {
            addRequiredNotesToPXE(oracleAddress, user, txHash, tokenAddress, fee);
        }
    }, [isDeployed]);

    const addRequiredNotesToPXE = async (oracle: AztecAddress, user: CompleteAddress, txHash: TxHash, token: AztecAddress, fee: number) => {
        // Add note for the payment token
        
        await pxe.addNote(
            new ExtendedNote(new Note([token.toField()]), user.address, oracle, new Fr(1), txHash)
        );

        // Add note for the fee
        await pxe.addNote(
            new ExtendedNote(new Note([new Fr(fee)]), user.address, oracle, new Fr(2), txHash)
        );
    };

    const questionsHeader =
        <div className={styles.questionHeader}>
            Questions
            <Button
                onClick={() => setStatus(Status.NewQuestion)}
                text={'New Question'}
                size={ButtonSize.Small}
                theme={ButtonTheme.Secondary} />
        </div>;

    const { header, content } = function () {
        if (isDeployed && isContractsInited && wallet) {
            switch (status) {
                case Status.Questions:
                    return {
                        header: questionsHeader,
                        content: <Questions wallet={wallet} oracle={oracleContract} onQuestionSelected={onQuestionSelected}/>
                    };
                case Status.NewQuestion:
                    return {
                        header: 'New Question',
                        content: <CreateQuestion
                            user={user}
                            oracle={oracleAddress}
                            token={tokenAddress}
                            fee={fee}
                            onBack={onBack}
                            onError={setError} />
                    };
                case Status.AnswerQuestion:
                    return {
                        header: 'Answer Question',
                        content: <AnswerQuestion
                            question={selectedQuestion && selectedQuestion.request}
                            requester={selectedQuestion && AztecAddress.fromString(selectedQuestion.requester)}
                            fee={fee}
                            oracle={oracleContract}
                            onBack={onBack}
                            onError={setError}
                        />
                    };
            }
        } else {
            return {
                header: '',
                content: <></>
            }
        }
    }();

    return (
        <div className={styles.oracle}>
            {/* Add a token mint + balance view on the top bar */}
            {tokenContract && wallet && <TokenBalance token={tokenContract} wallet={wallet} onResult={handleResult} />}

            {/* Deploy token + oracle. User should write the fee in the ui  */}
            {!isDeployed && <DeployOracle wallet={wallet} onDeploy={onDeploy} onError={setError} />}

            {/* Use the Questions component to render the list of Questions */}
            {isDeployed && isContractsInited && <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={header} cardContent={content} />}

            {/* Use the ContractFunctionForm component to render the form to ask a question */}
        </div>
    );
}