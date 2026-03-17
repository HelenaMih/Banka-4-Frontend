import React, { useState, useEffect } from 'react';
// Jedan nivo unazad (izlazak iz pages) pa ulazak u ostale foldere
import { loansApi } from '../api/endpoints/loans';
import LoanList from '../features/loans/LoanList';
import LoanDetails from '../features/loans/LoanDetails';
import Spinner from '../components/ui/Spinner'; 
import Alert from '../components/ui/Alert';     
import styles from './Loans.module.css'; // Ovde ostaje jedna tačka jer je CSS u istom folderu

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Pozivamo API koji smo definisali u endpoints/loans.js
    loansApi.getAll()
      .then(res => {
        setLoans(res.data);
        // Po specifikaciji, ako ima kredita, možemo automatski selektovati prvi
        if (res.data.length > 0) {
          setSelectedLoan(res.data[0]);
        }
      })
      .catch(err => {
        console.error("Greška pri učitavanju kredita:", err);
        setError("Nije moguće učitati podatke o kreditima.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.center}><Spinner /></div>;
  if (error) return <div className={styles.center}><Alert type="error" message={error} /></div>;

  return (
    <div className={styles.loansPage}>
      <header className={styles.pageHeader}>
        <h1>Pregled aktivnih kredita</h1>
        <p>Master-Detail prikaz vaših zaduženja i plana otplate</p>
      </header>

      <div className={styles.layout}>
        {/* LEVA STRANA: Master View (Lista) */}
        <aside className={styles.masterSide}>
          <LoanList 
            loans={loans} 
            selectedId={selectedLoan?.id} 
            onSelectLoan={setSelectedLoan} 
          />
        </aside>

        {/* DESNA STRANA: Detail View (Detalji) */}
        <main className={styles.detailSide}>
          {selectedLoan ? (
            <LoanDetails loan={selectedLoan} />
          ) : (
            <div className={styles.emptyState}>
              <p>Izaberite kredit sa leve strane kako biste videli anuitetni plan i detalje.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}