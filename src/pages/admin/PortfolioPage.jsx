import { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions'; 
import Navbar from '../../components/layout/Navbar';
import PortfolioTable from '../../features/portfolio/PortfolioTable';
import ProfitSummary from '../../features/portfolio/ProfitSummary';
import TaxSummary from '../../features/portfolio/TaxSummary';
import OptionsSection from '../../features/portfolio/OptionsSection';
import styles from './PortfolioPage.module.css';

//import { FAKE_PORTFOLIO_ASSETS, FAKE_PORTFOLIO_STATS } from '../../api/mock';
const FAKE_PORTFOLIO_ASSETS = [
    { 
        id: 1, 
        type: 'Stock', 
        ticker: 'AAPL', 
        amount: 100, 
        price: 150, 
        profit: 500, 
        lastModified: '2026-03-21', 
        status: 'Active' 
    },
    { 
        id: 2, 
        type: 'Option', 
        ticker: 'MSFT', 
        optionType: 'CALL', 
        strike: 280, 
        current: 300, 
        settlement: '2026-04-25', 
        status: 'ITM' 
    },
    { 
        id: 3, 
        type: 'Option', 
        ticker: 'TSLA', 
        optionType: 'PUT', 
        strike: 700, 
        current: 680, 
        settlement: '2026-03-20', 
        status: 'OTM' 
    }
];

const FAKE_PORTFOLIO_STATS = {
    taxPaid: 1200,
    taxUnpaid: 450
};
export default function PortfolioPage() {
  const pageRef = useRef(null);
  const { can } = usePermissions();
  const user = useAuthStore(s => s.user);
  const initFromStorage = useAuthStore(s => s.initFromStorage);

  useEffect(() => {
    if (!user) initFromStorage();
  }, [user, initFromStorage]);

  // Permisije
  const canManageOTC = can('portfolio.otc.manage') || can('admin.all');
  const canExercise = can('portfolio.options.exercise');
  const canViewOptions = can('portfolio.options.view') || canExercise;

  // 1. FILTRIRANJE - Sada precizno
  const stocks = FAKE_PORTFOLIO_ASSETS.filter(a => a.type?.toUpperCase() === 'STOCK');
  const options = FAKE_PORTFOLIO_ASSETS.filter(a => a.type?.toUpperCase() === 'OPTION');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', { opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  if (!user) return null;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />
      <main className={styles.sadrzaj}>
        
        {/* Header - Svi vide */}
        <div className="page-anim">
          <div className={styles.breadcrumb}><span>Portfolio</span></div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Moj Portfolio</h1>
              <p className={styles.pageDesc}>Pregled akcija i finansijskih instrumenata.</p>
            </div>
            <TaxSummary stats={FAKE_PORTFOLIO_STATS} />
          </div>
        </div>

        {/* ProfitSummary - Sada mu šaljemo samo stocks jer futures ne postoje */}
        <div className="page-anim">
          <ProfitSummary assets={stocks} />
        </div>

        {/* TABELA 1: Akcije (Stocks) */}
        <div className={`page-anim ${styles.tableCard}`}>
          <div className={styles.cardHeader}><h3>Hartije od vrednosti</h3></div>
          <PortfolioTable assets={stocks} isAdmin={canManageOTC} />
        </div>

        {/* TABELA 2: Opcije (Samo Aktuar/Admin) */}
        {canViewOptions && (
          <div className={`page-anim ${styles.tableCard}`} style={{ marginTop: '32px' }}>
            <div className={styles.cardHeader}><h3>Opcije i Derivati</h3></div>
            {/* Ovde šalješ options, ne optionAssets da bi bilo jasnije */}
            <OptionsSection assets={options} canExercise={canExercise} />
          </div>
        )}

        {/* TABELA 3: OTC Panel (Samo Admin) */}
        {canManageOTC && (
          <div className={`page-anim ${styles.tableCard}`} style={{ marginTop: '32px' }}>
            <div className={styles.cardHeader}>
               <div className={styles.headerWithBadge}>
                  <h3>Upravljanje javnim akcijama (OTC)</h3>
                  <span className={styles.adminBadge}>ADMIN CONTROL</span>
               </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>TICKER</th>
                    <th>JAVNA KOLIČINA</th>
                    <th>CENA</th>
                    <th style={{ textAlign: 'right' }}>AKCIJE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Filtrirano direktno na stocks */}
                  {stocks.map(asset => (
                    <tr key={asset.id}>
                      <td className={styles.ticker}>{asset.ticker}</td>
                      <td>{asset.amount}</td>
                      <td>${asset.price}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className={styles.removeBtn}>Povuci sa portala</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}