// src/features/portfolio/OptionsSection.jsx
import styles from './PortfolioTable.module.css'; // Delimo osnovne stilove tabele

export default function OptionsSection({ assets = [] }) {
  
  // Logika za izvršenje opcije (Exercise)
  const handleExercise = (id, ticker) => {
    const potvrda = window.confirm(`Da li ste sigurni da želite da izvršite (exercise) opciju za ${ticker}?`);
    if (potvrda) {
      console.log("Pozivanje API-ja za exercise ID:", id);
      // Ovde ide tvoj api.post(`/portfolio/exercise/${id}`)
      alert(`Opcija za ${ticker} je uspešno izvršena.`);
    }
  };

  // Pomoćna funkcija za proveru da li je opcija "Active" (nije istekao rok)
  const isExpired = (settlementDate) => {
    return new Date() > new Date(settlementDate);
  };

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>TICKER</th>
            <th>TIP</th>
            <th>STRIKE</th>
            <th>CURRENT</th>
            <th>SETTLEMENT</th>
            <th>STATUS</th>
            <th style={{ textAlign: 'right' }}>AKCIJE</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--tx-3)' }}>
                Trenutno nema dostupnih opcija.
              </td>
            </tr>
          ) : (
            assets.map((opt) => {
              const expired = isExpired(opt.settlement);
              const canExercise = opt.status === 'ITM' && !expired;

              return (
                <tr key={opt.id} className={expired ? styles.expiredRow : ''}>
                  <td className={styles.ticker}>{opt.ticker}</td>
                  <td className={styles.optionType}>{opt.optionType || 'CALL'}</td>
                  <td>${opt.strike}</td>
                  <td>${opt.current || opt.price}</td>
                  <td className={expired ? styles.neg : ''}>
                    {opt.settlement} {expired && '(Isteklo)'}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${opt.status === 'ITM' ? styles.itm : styles.otm}`}>
                      {opt.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {canExercise ? (
                      <button 
                        className={styles.exerciseBtn}
                        onClick={() => handleExercise(opt.id, opt.ticker)}
                      >
                        EXERCISE
                      </button>
                    ) : (
                      <span className={styles.naText}>N/A</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}