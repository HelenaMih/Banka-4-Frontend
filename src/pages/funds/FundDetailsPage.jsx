import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';
import ClientHeader from '../../components/layout/ClientHeader';
import Navbar from '../../components/layout/Navbar';
import Alert from '../../components/ui/Alert';
import styles from './FundDetailsPage.module.css';

const RANGE_OPTIONS = [
  { value: 'monthly',   label: 'Mesečno' },
  { value: 'quarterly', label: 'Kvartalno' },
  { value: 'yearly',    label: 'Godišnje' },
];

export default function FundDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const user = useAuthStore(s => s.user);
  const { isSupervisor } = usePermissions();
  const isClient = user?.identity_type === 'client';

  const [fund, setFund]           = useState(null);
  const [assets, setAssets]       = useState([]);
  const [performance, setPerformance] = useState([]);
  const [perfRange, setPerfRange] = useState('monthly');
  const [loading, setLoading]     = useState(true);
  const [perfLoading, setPerfLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [feedback, setFeedback]   = useState(null);

  const [sellModal, setSellModal]     = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [sellSubmitting, setSellSubmitting]     = useState(false);

  const computeAndSet = (fundData, assetsData) => {
    const totalAssetsValue = assetsData.reduce(
      (sum, a) => sum + Number(a.price ?? 0) * Number(a.volume ?? 0),
      0
    );
    const totalInitialMarginCost = assetsData.reduce(
      (sum, a) => sum + Number(a.initialMarginCost ?? 0),
      0
    );
    const liquidity = Number(fundData?.liquidity ?? fundData?.liquidity_rsd ?? 0);
    const calculatedTotalValue = liquidity + totalAssetsValue;
    const calculatedProfit = calculatedTotalValue - totalInitialMarginCost;
    setFund({ ...fundData, calculatedTotalValue, calculatedProfit });
    setAssets(assetsData);
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [resDetails, resAssets] = await Promise.all([
          investmentFundsApi.getFundDetails(id),
          investmentFundsApi.getFundAssets(id),
        ]);
        const fundData   = resDetails?.data ?? resDetails;
        const assetsData = Array.isArray(resAssets?.data ?? resAssets)
          ? (resAssets?.data ?? resAssets)
          : [];
        computeAndSet(fundData, assetsData);
      } catch {
        setError('Greška pri učitavanju fonda. Proverite vezu sa serverom.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadPerf = async () => {
      try {
        setPerfLoading(true);
        const res = await investmentFundsApi.getFundPerformance(id, perfRange);
        const perfData = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : [];
        setPerformance(perfData);
      } catch {
        setPerformance([]);
      } finally {
        setPerfLoading(false);
      }
    };
    loadPerf();
  }, [id, perfRange]);

  const reload = async () => {
    try {
      const [resDetails, resAssets] = await Promise.all([
        investmentFundsApi.getFundDetails(id),
        investmentFundsApi.getFundAssets(id),
      ]);
      const fundData   = resDetails?.data ?? resDetails;
      const assetsData = Array.isArray(resAssets?.data ?? resAssets)
        ? (resAssets?.data ?? resAssets)
        : [];
      computeAndSet(fundData, assetsData);
    } catch {
      // silently ignore reload errors
    }
  };

  useLayoutEffect(() => {
    if (loading || !fund) return;
    const ctx = gsap.context(() => {
      const nodes = pageRef.current?.querySelectorAll('.page-anim') ?? [];
      if (!nodes.length) return;
      gsap.from(nodes, { opacity: 0, y: 20, duration: 0.45, stagger: 0.08, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, [loading, fund]);

  async function handleSellConfirm() {
    if (!sellModal) return;
    try {
      setSellSubmitting(true);
      await investmentFundsApi.sellFundAsset(id, sellModal.id ?? sellModal.assetId, {});
      setFeedback({ type: 'uspeh', text: `Hartija ${sellModal.ticker ?? ''} je uspešno prodata.` });
      setSellModal(null);
      await reload();
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.message || 'Prodaja nije uspela.' });
    } finally {
      setSellSubmitting(false);
    }
  }

  async function handleActionSubmit(e) {
    e.preventDefault();
    const amount = Number(actionAmount);
    if (!actionAmount || isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'greska', text: 'Unesite validan iznos.' });
      return;
    }
    try {
      setActionSubmitting(true);
      const type = actionModal?.type;
      if (type === 'invest') {
        await investmentFundsApi.investInFund(id, { amount });
        setFeedback({ type: 'uspeh', text: 'Investicija je uspešno evidentirana.' });
      } else if (type === 'withdraw') {
        await investmentFundsApi.withdrawFromFund(id, { amount });
        setFeedback({ type: 'uspeh', text: 'Povlačenje sredstava je uspešno.' });
      } else if (type === 'deposit') {
        await investmentFundsApi.depositToFund(id, { amount_rsd: amount });
        setFeedback({ type: 'uspeh', text: 'Uplata u fond je uspešno evidentirana.' });
      } else if (type === 'withdrawFund') {
        await investmentFundsApi.withdrawFromFund(id, { amount_rsd: amount });
        setFeedback({ type: 'uspeh', text: 'Povlačenje iz fonda je uspešno.' });
      }
      setActionModal(null);
      setActionAmount('');
      await reload();
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.message || 'Akcija nije uspela.' });
    } finally {
      setActionSubmitting(false);
    }
  }

  const HeaderComponent = isClient ? ClientHeader : Navbar;
  const headerProps = isClient ? { activeNav: 'funds' } : {};

  if (loading) {
    return (
      <div className={styles.page}>
        <HeaderComponent {...headerProps} />
        <div className={styles.loadingState}>Učitavanje...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderComponent {...headerProps} />
        <main className={styles.content}>
          <Alert tip="greska" poruka={error} />
        </main>
      </div>
    );
  }

  if (!fund) return null;

  const managerName = [
    fund.manager?.first_name ?? fund.manager?.firstName ?? '',
    fund.manager?.last_name  ?? fund.manager?.lastName  ?? '',
  ].filter(Boolean).join(' ') || '—';

  const totalValue    = fund.calculatedTotalValue ?? 0;
  const profit        = fund.calculatedProfit ?? 0;
  const liquidity     = Number(fund.liquidity ?? fund.liquidity_rsd ?? 0);
  const minInvestment = Number(fund.minimumInvestment ?? fund.minimum_investment ?? 0);
  const accountNumber =
    fund.fund_account?.account_number ??
    fund.accountNumber ??
    fund.account_number ??
    '—';

  return (
    <div ref={pageRef} className={styles.page}>
      <HeaderComponent {...headerProps} />

      <main className={styles.content}>

        {/* Breadcrumb */}
        <div className={`page-anim ${styles.breadcrumb}`}>
          <button
            className={styles.breadcrumbLink}
            onClick={() => navigate(isClient ? '/client/investment-funds' : '/profit-bank')}
          >
            Investicioni fondovi
          </button>
          <span className={styles.breadcrumbSep}>›</span>
          <span>{fund.name ?? 'Fond'}</span>
        </div>

        {/* Page header */}
        <div className={`page-anim ${styles.pageHeader}`}>
          <div>
            <h1 className={styles.pageTitle}>{fund.name}</h1>
            {fund.description && <p className={styles.pageDesc}>{fund.description}</p>}
          </div>
          {isSupervisor && <span className={styles.supervisorBadge}>Supervisor</span>}
        </div>

        {feedback && (
          <div className="page-anim" style={{ marginBottom: 20 }}>
            <Alert tip={feedback.type} poruka={feedback.text} />
          </div>
        )}

        {/* Info cards */}
        <section className={`page-anim ${styles.statsGrid}`}>
          <InfoCard label="Menadžer"           value={managerName} />
          <InfoCard label="Vrednost fonda"     value={formatRSD(totalValue)} />
          <InfoCard label="Minimalni ulog"     value={formatRSD(minInvestment)} />
          <InfoCard
            label="Profit"
            value={formatRSD(profit)}
            valueClass={profit >= 0 ? styles.positive : styles.negative}
          />
          <InfoCard label="Likvidnost"         value={formatRSD(liquidity)} />
          <InfoCard label="Broj računa fonda"  value={accountNumber} />
        </section>

        {/* Assets table */}
        <section className={`page-anim ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardEyebrow}>Hartije</div>
              <h2 className={styles.cardTitle}>Sastav fonda</h2>
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>InitialMarginCost</th>
                  <th>AcquisitionDate</th>
                  {isSupervisor && <th />}
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={isSupervisor ? 7 : 6} className={styles.emptyTable}>
                      Fond nema hartija.
                    </td>
                  </tr>
                ) : (
                  assets.map((a, i) => (
                    <tr key={a.id ?? a.assetId ?? i}>
                      <td className={styles.ticker}>{a.ticker ?? '—'}</td>
                      <td>{formatNum(a.price)}</td>
                      <td>
                        <span className={Number(a.change ?? 0) >= 0 ? styles.positive : styles.negative}>
                          {a.change != null
                            ? `${Number(a.change) >= 0 ? '+' : ''}${Number(a.change).toFixed(2)}%`
                            : '—'}
                        </span>
                      </td>
                      <td>{a.volume ?? '—'}</td>
                      <td>{formatNum(a.initialMarginCost)}</td>
                      <td>
                        {a.acquisitionDate
                          ? new Date(a.acquisitionDate).toLocaleDateString('sr-RS')
                          : '—'}
                      </td>
                      {isSupervisor && (
                        <td>
                          <button className={styles.btnSell} onClick={() => setSellModal(a)}>
                            Prodaj
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance section */}
        <section className={`page-anim ${styles.card}`}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardEyebrow}>Performanse</div>
              <h2 className={styles.cardTitle}>Istorijski prikaz</h2>
            </div>
            <div className={styles.rangeSelector}>
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.rangeBtn} ${perfRange === opt.value ? styles.rangeBtnActive : ''}`}
                  onClick={() => setPerfRange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {perfLoading ? (
            <div className={styles.emptyTable}>Učitavanje performansi...</div>
          ) : performance.length === 0 ? (
            <div className={styles.emptyTable}>
              Nema podataka o performansama za izabrani period.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Vrednost fonda</th>
                    <th>Promena</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, i) => {
                    const changeVal = p.change ?? p.change_percent;
                    return (
                      <tr key={i}>
                        <td>
                          {p.date
                            ? new Date(p.date).toLocaleDateString('sr-RS')
                            : (p.period ?? '—')}
                        </td>
                        <td>{formatRSD(p.value ?? p.fund_value ?? p.total_value)}</td>
                        <td>
                          <span className={Number(changeVal ?? 0) >= 0 ? styles.positive : styles.negative}>
                            {changeVal != null
                              ? `${Number(changeVal) >= 0 ? '+' : ''}${Number(changeVal).toFixed(2)}%`
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Action buttons */}
        <section className={`page-anim ${styles.actionSection}`}>
          {isClient ? (
            <>
              <button
                className={styles.btnPrimary}
                onClick={() => { setActionModal({ type: 'invest' }); setActionAmount(''); }}
              >
                Investiraj
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => { setActionModal({ type: 'withdraw' }); setActionAmount(''); }}
              >
                Povuci sredstva
              </button>
            </>
          ) : isSupervisor ? (
            <>
              <button
                className={styles.btnPrimary}
                onClick={() => { setActionModal({ type: 'deposit' }); setActionAmount(''); }}
              >
                Uplata u fond
              </button>
              <button
                className={styles.btnGhost}
                onClick={() => { setActionModal({ type: 'withdrawFund' }); setActionAmount(''); }}
              >
                Povlačenje iz fonda
              </button>
            </>
          ) : null}
        </section>

      </main>

      {/* Sell confirmation modal */}
      {sellModal && (
        <div className={styles.modalBackdrop} onClick={() => setSellModal(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Potvrda prodaje</h3>
                <p className={styles.modalText}>
                  Da li ste sigurni da želite da prodate hartiju{' '}
                  <strong>{sellModal.ticker ?? ''}</strong>?
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setSellModal(null)}>×</button>
            </div>
            <div className={styles.modalInfoRow}>
              <span className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Ticker:</span>
                <strong>{sellModal.ticker ?? '—'}</strong>
              </span>
              <span className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Volume:</span>
                <strong>{sellModal.volume ?? '—'}</strong>
              </span>
              <span className={styles.modalInfoItem}>
                <span className={styles.modalInfoLabel}>Price:</span>
                <strong>{formatNum(sellModal.price)}</strong>
              </span>
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setSellModal(null)}
                disabled={sellSubmitting}
              >
                Otkaži
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSellConfirm}
                disabled={sellSubmitting}
              >
                {sellSubmitting ? 'Prodaja...' : 'Potvrdi prodaju'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div className={styles.modalBackdrop} onClick={() => setActionModal(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>{getActionTitle(actionModal.type)}</h3>
                <p className={styles.modalText}>Fond: <strong>{fund.name}</strong></p>
              </div>
              <button className={styles.closeBtn} onClick={() => setActionModal(null)}>×</button>
            </div>
            <form onSubmit={handleActionSubmit} className={styles.modalBody}>
              <div className={styles.field}>
                <label>
                  Iznos (RSD)<span className={styles.required}> *</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Unesite iznos..."
                  value={actionAmount}
                  onChange={e => setActionAmount(e.target.value)}
                  required
                />
              </div>
              {actionModal.type === 'withdrawFund' && (
                <div className={styles.infoStrip}>
                  Dostupna likvidnost fonda: {formatRSD(liquidity)}
                </div>
              )}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setActionModal(null)}
                  disabled={actionSubmitting}
                >
                  Otkaži
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={actionSubmitting}>
                  {actionSubmitting ? 'Slanje...' : 'Potvrdi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getActionTitle(type) {
  if (type === 'invest')      return 'Investiraj u fond';
  if (type === 'withdraw')    return 'Povuci sredstva iz fonda';
  if (type === 'deposit')     return 'Uplata u fond';
  if (type === 'withdrawFund') return 'Povlačenje iz fonda';
  return 'Akcija';
}

function InfoCard({ label, value, valueClass }) {
  return (
    <div className={styles.infoCard}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={`${styles.infoValue}${valueClass ? ` ${valueClass}` : ''}`}>{value}</strong>
    </div>
  );
}

function formatRSD(value) {
  if (value == null) return '—';
  return `${new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))} RSD`;
}

function formatNum(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
