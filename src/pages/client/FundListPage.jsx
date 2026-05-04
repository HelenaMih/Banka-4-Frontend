import { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuthStore } from '../../store/authStore';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { useFetch } from '../../hooks/useFetch';
import ClientHeader from '../../components/layout/ClientHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import styles from './FundListPage.module.css';

function formatRSD(value) {
  if (value == null) return '—';
  return `${new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))} RSD`;
}

export default function FundListPage() {
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const [search, setSearch] = useState('');

  // Try the dedicated /funds endpoint; fall back to /investment-funds on error
  const { data: fundsResponse, loading, error } = useFetch(
    () => investmentFundsApi.getAllFunds().catch(() => investmentFundsApi.getFunds()),
    []
  );

  const funds = useMemo(() => {
    const raw = Array.isArray(fundsResponse)
      ? fundsResponse
      : fundsResponse?.data ?? fundsResponse?.content ?? [];
    if (!search) return raw;
    const q = search.toLowerCase();
    return raw.filter(
      f =>
        (f.name ?? f.fund_name ?? '').toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q)
    );
  }, [fundsResponse, search]);

  useLayoutEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.07,
        ease: 'power2.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, [loading]);

  if (!user) return null;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <ClientHeader activeNav="funds" />

      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Tržište</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbAktivna}>Investicioni fondovi</span>
          </div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Investicioni fondovi</h1>
              <p className={styles.pageDesc}>
                Pregled dostupnih investicionih fondova i mogućnost ulaganja.
              </p>
            </div>
          </div>
        </div>

        <div className={`page-anim ${styles.controlRow}`}>
          <input
            className={styles.searchInput}
            placeholder="Pretraži po nazivu ili opisu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.center}><Spinner /></div>
        ) : error ? (
          <div className={styles.center}>
            <Alert tip="greska" poruka="Nije moguće učitati fondove. Pokušajte ponovo." />
          </div>
        ) : funds.length === 0 ? (
          <div className={`page-anim ${styles.emptyState}`}>
            {search ? 'Nema fondova koji odgovaraju pretrazi.' : 'Nema dostupnih fondova.'}
          </div>
        ) : (
          <div className={`page-anim ${styles.tableCard}`}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Naziv fonda</th>
                    <th>Menadžer</th>
                    <th>Dostupna likvidnost</th>
                    <th>Opis</th>
                    <th>Akcija</th>
                  </tr>
                </thead>
                <tbody>
                  {funds.map((fund, idx) => {
                    const id = fund.fund_id ?? fund.id ?? idx;
                    const name = fund.name ?? fund.fund_name ?? '—';
                    const manager = fund.manager
                      ? `${fund.manager.first_name ?? ''} ${fund.manager.last_name ?? ''}`.trim()
                      : (fund.manager_name ?? '—');
                    const liquidity = fund.liquidity_rsd ?? fund.available_liquidity_rsd ?? null;
                    const desc = fund.description ?? '—';

                    return (
                      <tr key={id}>
                        <td>
                          <button
                            className={styles.linkButton}
                            onClick={() => navigate(`/client/investment-funds/${id}`)}
                          >
                            {name}
                          </button>
                        </td>
                        <td>{manager || '—'}</td>
                        <td>{formatRSD(liquidity)}</td>
                        <td className={styles.descCell}>{desc}</td>
                        <td>
                          <button
                            className={styles.btnPrimary}
                            onClick={() => navigate(`/client/investment-funds/${id}`)}
                          >
                            Detalji
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
