import { Button, ButtonSize, ButtonTheme, Card, CardTheme, ImageButton, ImageButtonIcon } from "@aztec/aztec-ui";
import { AztecAddress, CompleteAddress } from "@aztec/aztec.js";
import { useState } from "react";
import { ApproveTransfer } from "./ApproveTransfer.js";
import { TokenMinter } from "./TokenMinter.js";
import styles from './TokenMinter.module.scss';
import { Copy } from "./copy.js";

interface Props {
    tokenAddress: AztecAddress;
    user: CompleteAddress;
    onResult: (result: string) => void;
}

export function TokenUtils({ tokenAddress, user, onResult }: Props) {
    const [selectedUtil, setSelectedUtil] = useState(-1);

    const utils = {
        'Token Minter': <TokenMinter token={tokenAddress} minter={user} onResult={onResult} />,
        'Approve Transfer': <ApproveTransfer tokenAddress={tokenAddress} user={user} onResult={onResult} />,
    }

    const header = `Token utils` + (selectedUtil == (-1) ? '' : ` ( ${Object.keys(utils)[selectedUtil]} )`);

    const content = (
        <div className={styles.container}>
            {
                selectedUtil == (-1) ?
                    <div>
                        <div className={styles.tagContainer}>
                            <div className={styles.tag}>
                                <div className={styles.title}>{`Token`}</div>
                                {!!tokenAddress && (
                                    <div className={styles.address}>
                                        {`${tokenAddress.toShortString()}`}
                                        <Copy value={tokenAddress.toString()} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.tokenUtils}>
                            {Object.keys(utils).map((util, index) => (
                                <ImageButton
                                    key={util}
                                    icon={ImageButtonIcon.Wallet}
                                    label={util}
                                    onClick={() => {
                                        setSelectedUtil(index);
                                    }}
                                />
                            ))}
                        </div>
                    </div> :
                    <>
                        <Button
                            className={styles.back}
                            onClick={() => setSelectedUtil(-1)}
                            text={'Back'}
                            size={ButtonSize.Small}
                            theme={ButtonTheme.Secondary}
                        />
                        {Object.values(utils)[selectedUtil]}
                    </>
            }
        </div>
    )

    return (
        <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={header} cardContent={content} />
    )
}