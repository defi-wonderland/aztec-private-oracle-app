import { FILTERED_FUNCTION_NAMES, contractArtifact, tokenArtifact } from '../config.js';
import { ApproveTransfer } from './components/ApproveTransfer.js';
import { MessageHasher } from './components/MessageHasher.js';
import { TokenMinter } from './components/TokenMinter.js';
import { Copy } from './components/copy.js';
import { ContractFunctionForm, Popup, ReadContractStorage } from './components/index.js';
import styles from './contract.module.scss';
import { Button, ButtonSize, ButtonTheme, Card, CardTheme, ImageButton, ImageButtonIcon } from '@aztec/aztec-ui';
import { AztecAddress, CompleteAddress, Fr, NotePreimage } from '@aztec/aztec.js';
import { ContractArtifact, FunctionArtifact } from '@aztec/foundation/abi';
import { ReactNode, useState } from 'react';

const functionTypeSortOrder = {
  secret: 0,
  open: 1,
  unconstrained: 2,
};

interface Props {
  wallet: CompleteAddress;
}

export function Contract({ wallet }: Props) {
  const [isTermsOpen, setTermsOpen] = useState<boolean>(false);
  const [contractAddress, setContractAddress] = useState<AztecAddress | undefined>();
  const [tokenContractAddress, setTokenContractAddress] = useState<AztecAddress | undefined>();
  const [errorMsg, setError] = useState('');
  const [result, setResult] = useState('');

  const handleContractDeployed = (address: AztecAddress) => {
    setContractAddress(address);
    setResult(`Contract deployed at: ${address}`);
  };
  const handleTokenContractDeployed = (address: AztecAddress) => {
    setTokenContractAddress(address);
    setResult(`Token contract deployed at: ${address}`);
  };
  const handleResult = (returnValues: any) => {
    // TODO: serialize returnValues to string according to the returnTypes defined in the function abi.
    setResult(`Return values: ${returnValues}`);
  };
  const handleClosePopup = () => {
    setResult('');
    setError('');
  };

  const hasResult = !!(result || errorMsg);

  function renderCardContent(
    artifact: ContractArtifact,
    onDeploy: (address: AztecAddress) => void,

    contractAddress?: AztecAddress,
  ): { content: ReactNode; header: string } {
    const constructorAbi = artifact.functions.find(f => f.name === 'constructor')!;
    const [selectedFunctionIndex, setSelectedFunctionIndex] = useState<number>(-1);
    const [processingFunction, setProcessingFunction] = useState('');
    const handleSubmitForm = (functionName: string) => setProcessingFunction(functionName);
    const handleSuccess = (res: any) => {
      setProcessingFunction('');
      handleResult(res);
    }

    const handleError = (e: any) => {
      setProcessingFunction('');
      setError(e);
    }

    if (contractAddress) {
      const functions = artifact.functions
        .filter(f => f.name !== 'constructor' && !f.isInternal && !FILTERED_FUNCTION_NAMES.includes(f.name))
        .sort((a, b) => functionTypeSortOrder[a.functionType] - functionTypeSortOrder[b.functionType]);

      if (selectedFunctionIndex === -1) {
        return {
          header: 'Available Functions',
          content: (
            <div className={styles.selectorWrapper}>
              <div className={styles.tag}>
                <div className={styles.title}>{`${artifact.name}`}</div>
                {!!contractAddress && (
                  <div className={styles.address}>
                    {`${contractAddress.toShortString()}`}
                    <Copy value={contractAddress.toString()} />
                  </div>
                )}
              </div>
              <div className={styles.functions}>
                {functions.map((functionAbi: FunctionArtifact, index: number) => (
                  <ImageButton
                    key={functionAbi.name}
                    icon={ImageButtonIcon.Wallet}
                    label={functionAbi.name}
                    onClick={() => {
                      setSelectedFunctionIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>
          ),
        };
      }

      const selectedFunctionAbi = functions[selectedFunctionIndex];

      return {
        header: selectedFunctionAbi.name,
        content: (
          <>
            <Button
              className={styles.back}
              onClick={() => setSelectedFunctionIndex(-1)}
              text={'Back'}
              size={ButtonSize.Small}
              theme={ButtonTheme.Secondary}
            />
            <ContractFunctionForm
              key={selectedFunctionAbi.name}
              wallet={wallet}
              contractAddress={contractAddress}
              artifact={artifact}
              functionAbi={selectedFunctionAbi}
              defaultAddress={wallet.address.toString()}
              isLoading={processingFunction === selectedFunctionAbi.name && !hasResult}
              disabled={processingFunction === selectedFunctionAbi.name && hasResult}
              onSubmit={() => handleSubmitForm(selectedFunctionAbi.name)}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </>
        ),
      };
    }

    return {
      header: `Deploy Contract (${artifact.name})`,
      content: (
        <ContractFunctionForm
          wallet={wallet}
          artifact={artifact}
          functionAbi={constructorAbi}
          defaultAddress={wallet.address.toString()}
          buttonText="Deploy"
          isLoading={!!processingFunction && !hasResult}
          disabled={!!processingFunction && hasResult}
          onSubmit={() => handleSubmitForm('constructor')}
          onSuccess={onDeploy}
          onError={handleError}
        />
      ),
    };
  }

  function renderQuestionsStorage(contractAddress?: AztecAddress): { content: ReactNode; header: string } {

    const parseQuestion = (question: Fr[]) => {
      return [
        question[0].toBigInt().toString(), // Question
        question[1].toShortString(), // Requester
        question[2].toShortString(), // Divinity
      ]
    }

    const parseResult = (result: NotePreimage[]) => (
      result.map(question =>
        parseQuestion(question.items)
      )
    )

    if (contractAddress) {
      return {
        header: 'Questions',
        content: (
          <div className={styles.selectorWrapper}>
            <ReadContractStorage
              wallet={wallet}
              contractAddress={contractAddress}
              storageSlot={1}
              header={['Request', 'Requester', 'Divinity']}
              parseResult={parseResult}
            />
          </div>
        )
      }
    } else {
      return {
        header: '',
        content: <></>
      }
    }
  }

  function renderAnswersStorage(contractAddress?: AztecAddress): { content: ReactNode; header: string } {

    const parseAnswer = (answer: Fr[]) => {
      return [
        answer[0].toBigInt().toString(), // Question
        answer[1].toBigInt().toString(), // Answer
        answer[2].toShortString(), // Requester
      ]
    }

    const parseResult = (result: NotePreimage[]) => (
      result.map(answer =>
        parseAnswer(answer.items)
      )
    )

    if (contractAddress) {
      return {
        header: 'Answers',
        content: (
          <div className={styles.selectorWrapper}>
            <ReadContractStorage
              wallet={wallet}
              contractAddress={contractAddress}
              storageSlot={2}
              header={['Request', 'Answer', 'Requester']}
              parseResult={parseResult}
            />
          </div>
        )
      }
    } else {
      return {
        header: '',
        content: <></>
      }
    }
  }

  const { header: oracleHeader, content: oracleContent } = renderCardContent(contractArtifact, handleContractDeployed, contractAddress);
  const { header: tokenHeader, content: tokenContent } = renderCardContent(tokenArtifact, handleTokenContractDeployed, tokenContractAddress);
  const { header: questionsHeader, content: questionsContent } = renderQuestionsStorage(contractAddress);
  const { header: answersHeader, content: answersContent } = renderAnswersStorage(contractAddress);

  return (
    <div className={styles.contractContentContainer}>
      <div className={styles.contractContent}>
        <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={oracleHeader} cardContent={oracleContent} />
        <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={tokenHeader} cardContent={tokenContent} />
        {contractAddress && <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={questionsHeader} cardContent={questionsContent} />}
        {contractAddress && <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={answersHeader} cardContent={answersContent} />}
        {/* <MessageHasher /> */}
        {tokenContractAddress && <TokenMinter token={tokenContractAddress} minter={wallet} onResult={handleResult} />}
        {tokenContractAddress && <ApproveTransfer tokenAddress={tokenContractAddress} user={wallet} onResult={handleResult} />}
        <div className={styles.tos} onClick={() => setTermsOpen(true)}>
          Terms of Service
        </div>
        {!!(errorMsg || result) && (
          <Popup isWarning={!!errorMsg} onClose={handleClosePopup}>
            {errorMsg || result}
          </Popup>
        )}
        {isTermsOpen && (
          <Popup isWarning={false} onClose={() => setTermsOpen(false)}>
            Please note that any example oracle contract, user interface, or demonstration set out herein is provided
            solely for informational/academic purposes only and does not constitute any inducement to use, deploy and/or
            any confirmation of any Aztec oracle. Any implementation of any such contract with an interface or any other
            infrastructure should be used in accordance with applicable laws and regulations.
          </Popup>
        )}
      </div>
    </div>
  );
}
