import styles from './Wonderland.module.scss';

export const MadeByWonderland = () => {
    const handleClick = () => {
        window.open('https://defi.sucks/', '_blank');
    };

    return (
        <div className={styles.container} onClick={handleClick}>
            <span>Made with 🤍</span>
            <span>by{" "}</span>
            <img src="wonderland_logo.svg" alt="Wonderland" className={styles.logo} />
        </div >
    );
};