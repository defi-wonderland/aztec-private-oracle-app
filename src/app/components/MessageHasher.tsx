import { Button, ButtonSize, Card, CardTheme, Loader } from "@aztec/aztec-ui";
import styles from './MessageHasher.module.scss';
import { useEffect, useState } from "react";
import { Fr, computeMessageSecretHash } from "@aztec/aztec.js";

export function MessageHasher() {
    const [secret, setSecret] = useState('');
    const [secretHash, setSecretHash] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const updateSecret = async () => {
        setIsLoading(true);
        const newSecret = Fr.random();
        const newSecretHash = await computeMessageSecretHash(newSecret);
        setSecret(newSecret.toString());
        setSecretHash(newSecretHash.toString());
        setIsLoading(false);
    }

    useEffect(() => {
        if (secret == '') updateSecret();
    });

    const header = 'Secret Hasher';

    const content = (
        <div className={styles.container}>
            <div className={styles.regenerate}>
                {isLoading ? <Loader /> : <Button onClick={updateSecret} text={'Regenerate'} size={ButtonSize.Small} />}

            </div>
            <div className={styles.item}>
                <div className={styles.label}>Secret</div>
                <input
                    className={styles.input}
                    disabled={true}
                    type="text"
                    value={secret}
                />
            </div>
            <div className={styles.item}>
                <div className={styles.label}>Secret Hash</div>
                <input
                    className={styles.input}
                    disabled={true}
                    type="text"
                    value={secretHash}
                />
            </div>
        </div>
    )

    return (
        <>
            <Card className={styles.card} cardTheme={CardTheme.DARK} cardHeader={header} cardContent={content} />
        </>
    )
}