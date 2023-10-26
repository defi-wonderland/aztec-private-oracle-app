import { CompleteAddress } from '@aztec/aztec.js';
import { useState } from 'react';
import { Oracle } from './Oracle.js';
import { Popup } from './components/index.js';
import styles from './contract.module.scss';
import { MadeByWonderland } from './components/Wonderland.js';

interface Props {
  wallet: CompleteAddress;
}

export function Contract({ wallet }: Props) {
  const [isTermsOpen, setTermsOpen] = useState<boolean>(false);
  const [errorMsg, setError] = useState('');
  const [result, setResult] = useState('');

  const handleResult = (returnValues: any) => {
    // TODO: serialize returnValues to string according to the returnTypes defined in the function abi.
    setResult(`Return values: ${returnValues}`);
  };
  const handleClosePopup = () => {
    setResult('');
    setError('');
  };

  const hasResult = !!(result || errorMsg);

  return (
    <div className={styles.contractContentContainer}>
      <div className={styles.contractContent}>
        <Oracle user={wallet} setError={setError} setResult={setResult} />
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
        <MadeByWonderland />
      </div>
    </div>
  );
}
