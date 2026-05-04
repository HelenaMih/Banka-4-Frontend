import { useRef, useLayoutEffect, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuthStore } from '../../store/authStore';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { clientApi } from '../../api/endpoints/client';
import { useFetch } from '../../hooks/useFetch';
import ClientHeader from '../../components/layout/ClientHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { getErrorMessage } from '../../utils/apiError';
import styles from './FundDetailsPage.module.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatRSD(value) {
  if (value == null) return '—';
  return `${new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))} RSD`;
}

function formatPercent(value) {
  if (value == null) return '—';
  return `${new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))}%`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('sr-RS');
  } catch {
    return String(value);
  }
}

function InfoCard({ label, value, note }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={styles.infoValue}>{value}</strong>
      {note && <span className={styles.infoNote}>{note}</span>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function FundDetailsPage() {
  const { id: fundId } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const user = useAuthStore(s => s.user);
  const clientId = user?.client_id ?? user?.id;

  // ── fund details ─────────────────────────────────────────────────────────
  const {
    data: fundResponse,
    loading: fundLoading,
    error: fundError,
    refetch: refetchFund,
  } = useFetch(
    () =>
      investmentFundsApi.getFundDetails(fundId).catch(() =>
        // fallback: find in fund list
        investmentFundsApi
          .getAllFunds()
          .catch(() => investmentFundsApi.getFunds())
          .then(res => {
            const list = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
            const found = list.find(
              f => String(f.fund_id ?? f.id) === String(fundId)
            );
            if (!found) throw new Error('Fond nije pronađen.');
            return found;
          })
      ),
    [fundId]
  );

  const fund = useMemo(() => {
    if (!fundResponse) return null;
    return Array.isArray(fundResponse) ? fundResponse[0] : fundResponse?.data ?? fundResponse;
  }, [fundResponse]);

  // ── fund holdings (assets) ────────────────────────────────────────────────
  const [assets, setAssets] = useState(null);
  const [assetsLoading, setAssetsLoading] = useState(false);

  useEffect(() => {
    if (!fundId) return;
    let alive = true;
    setAssetsLoading(true);
    investmentFundsApi
      .getFundAssets(fundId)
      .then(res => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
        setAssets(list);
      })
      .catch(() => {
        if (alive) setAssets([]);
      })
      .finally(() => {
        if (alive) setAssetsLoading(false);
      });
    return () => { alive = false; };
  }, [fundId]);

  // ── fund profits (GET /profit/funds) ─────────────────────────────────────
  const [fundProfit, setFundProfit] = useState(null);

  useEffect(() => {
    if (!fundId) return;
    let alive = true;
    investmentFundsApi
      .getFundProfits()
      .then(res => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : res?.data ?? [];
        const row = list.find(
          p => String(p?.fund_id ?? p?.fundId ?? p?.id) === String(fundId)
        );
        setFundProfit(row ?? null);
      })
      .catch(() => { /* non-fatal */ });
    return () => { alive = false; };
  }, [fundId]);

  // ── performance ──────────────────────────────────────────────────────────
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (!fundId) return;
    let alive = true;
    investmentFundsApi
      .getFundPerformance(fundId)
      .then(res => { if (alive) setPerformance(res); })
      .catch(() => { /* endpoint not yet available */ });
    return () => { alive = false; };
  }, [fundId]);

  // ── derived metrics ───────────────────────────────────────────────────────
  const derivedValue = useMemo(() => {
    if (!fund) return null;
    const liquidity = Number(fund.liquidity_rsd ?? 0);
    if (!assets?.length) return liquidity || null;
    const holdingsValue = assets.reduce((sum, a) => {
      const price = Number(a.price ?? a.current_price ?? 0);
      const volume = Number(a.volume ?? a.quantity ?? a.amount ?? 0);
      return sum + price * volume;
    }, 0);
    return liquidity + holdingsValue;
  }, [fund, assets]);

  const derivedProfit = useMemo(() => {
    if (derivedValue == null) return null;
    if (!assets?.length) return null;
    const totalMargin = assets.reduce((sum, a) => {
      const imc = Number(a.initialMarginCost ?? a.initial_margin_cost ?? 0);
      return sum + imc;
    }, 0);
    return derivedValue - totalMargin;
  }, [derivedValue, assets]);

  // ── invest modal ─────────────────────────────────────────────────────────
  const [investOpen, setInvestOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [investAccountNumber, setInvestAccountNumber] = useState('');
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const { data: accountsData, loading: accountsLoading } = useFetch(
    () => clientApi.getAccounts(clientId),
    [clientId]
  );

  const accounts = useMemo(() => {
    const raw = Array.isArray(accountsData) ? accountsData : accountsData?.data ?? accountsData?.content ?? [];
    return raw;
  }, [accountsData]);

  // pre-select first account
  useEffect(() => {
    if (accounts.length && !investAccountNumber) {
      const first = accounts[0];
      const num =
        first.AccountNumber ?? first.account_number ?? first.accountNumber ?? first.number ?? '';
      setInvestAccountNumber(num);
    }
  }, [accounts, investAccountNumber]);

  async function handleInvestSubmit(e) {
    e.preventDefault();
    const amount = Number(investAmount);

    if (!investAccountNumber) {
      setFeedback({ type: 'greska', text: 'Izaberite račun sa kog investirate.' });
      return;
    }

    if (!investAmount || Number.isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'greska', text: 'Unesite validan iznos.' });
      return;
    }

    // Minimum investment validation
    const min = Number(
      fund?.minimumInvestment ?? fund?.minimum_investment ?? fund?.minimum_investment_rsd
    );
    if (!Number.isNaN(min) && min > 0 && amount < min) {
      setFeedback({ type: 'greska', text: `Minimalni ulog je ${formatRSD(min)}.` });
      return;
    }

    try {
      setInvestSubmitting(true);
      setFeedback(null);

      await investmentFundsApi.investInFund(fundId, {
        amount,
        accountNumber: String(investAccountNumber),
        AccountNumber: String(investAccountNumber),
        account_number: String(investAccountNumber),
      });

      setFeedback({ type: 'uspeh', text: 'Investicija je uspešno evidentirana.' });
      setInvestOpen(false);
      setInvestAmount('');
    } catch (err) {
      setFeedback({ type: 'greska', text: getErrorMessage(err, 'Investiranje nije uspelo.') });
    } finally {
      setInvestSubmitting(false);
    }
  }

  // ── animations ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (fundLoading) return;
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, [fundLoading]);

  // ── guard ─────────────────────────────────────────────────────────────────
  if (!user) return null;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <ClientHeader activeNav="funds" />

      <main className={styles.sadrzaj}>

        {/* Breadcrumb */}
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <button className={styles.breadcrumbLink} onClick={() => navigate('/client/investment-funds')}>
              Investicioni fondovi
            </button>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbAktivna}>
              {fund?.name ?? fund?.fund_name ?? 'Detalji fonda'}
            </span>
          </div>
          <button className={styles.btnBack} onClick={() => navigate('/client/investment-funds')}>
            ← Nazad na listu
          </button>
        </div>

        {fundLoading ? (
          <div className={styles.center}><Spinner /></div>
        ) : fundError ? (
          <div className={styles.center}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
              <Alert tip="greska" poruka={getErrorMessage(fundError, 'Greška pri učitavanju fonda.')} />
              <button className={styles.btnGhost} onClick={refetchFund}>Pokušaj ponovo</button>
            </div>
          </div>
        ) : !fund ? (
          <div className={styles.center}>
            <Alert tip="greska" poruka="Fond nije pronađen." />
          </div>
        ) : (
          <>
            {/* ── Header section ── */}
            <section className={`page-anim ${styles.card}`}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.eyebrow}>Investicioni fond</div>
                  <h1 className={styles.fundTitle}>{fund.name ?? fund.fund_name ?? '—'}</h1>
                  {fund.description && (
                    <p className={styles.fundDesc}>{fund.description}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className={styles.actionRow}>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => { setFeedback(null); setInvestOpen(true); }}
                  >
                    Investiraj
                  </button>

                  {/* Withdraw — disabled until backend exposes withdraw-for-client endpoint */}
                  <button
                    className={styles.btnGhost}
                    disabled
                    title="Povlačenje sredstava biće dostupno kada backend doda odgovarajući endpoint."
                  >
                    Povuci sredstva
                  </button>
                </div>
              </div>
            </section>

            {/* ── Feedback ── */}
            {feedback && (
              <div className="page-anim">
                <Alert tip={feedback.type} poruka={feedback.text} />
              </div>
            )}

            {/* ── Metrics grid ── */}
            <section className={`page-anim ${styles.card}`}>
              <div className={styles.sectionHeader}>
                <div className={styles.eyebrow}>Pregled fonda</div>
              </div>
              <div className={styles.detailGrid}>
                <InfoCard
                  label="Menadžer"
                  value={
                    fund.manager
                      ? `${fund.manager.first_name ?? ''} ${fund.manager.last_name ?? ''}`.trim() || '—'
                      : (fund.manager_name ?? '—')
                  }
                />
                <InfoCard
                  label="Dostupna likvidnost"
                  value={formatRSD(fund.liquidity_rsd ?? fund.available_liquidity_rsd)}
                />
                <InfoCard
                  label="Vrednost fonda"
                  value={derivedValue != null ? formatRSD(derivedValue) : '—'}
                  note={derivedValue != null ? 'Likvidnost + vrednost hartija' : 'Dostupno kada se učitaju hartije fonda'}
                />
                <InfoCard
                  label="Profit"
                  value={
                    derivedProfit != null
                      ? formatRSD(derivedProfit)
                      : formatRSD(
                          fundProfit?.profit_rsd ??
                          fundProfit?.profit ??
                          fund.profit_rsd ??
                          null
                        )
                  }
                  note={derivedProfit != null ? 'Vrednost fonda − inicijalna margina' : undefined}
                />
                <InfoCard
                  label="Udeo banke (%)"
                  value={formatPercent(fund.bank_share_percent)}
                />
                <InfoCard
                  label="Udeo banke (RSD)"
                  value={formatRSD(fund.bank_share_rsd)}
                />
              </div>
            </section>

            {/* ── Holdings / Assets table ── */}
            <section className={`page-anim ${styles.card}`}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.eyebrow}>Sastav fonda</div>
                  <h2 className={styles.sectionTitle}>Hartije u fondu</h2>
                </div>
              </div>

              {assetsLoading ? (
                <div className={styles.loadingState}>Učitavanje hartija...</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ticker</th>
                        <th>Cena</th>
                        <th>Promena (%)</th>
                        <th>Količina</th>
                        <th>Inicijalna margina</th>
                        <th>Datum nabavke</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!assets || assets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className={styles.emptyTable}>
                            {/* Show placeholder until backend provides fund assets endpoint */}
                            Nema dostupnih hartija za ovaj fond.
                            {/* TODO: Remove this message once GET /investment-funds/{id}/assets is confirmed in Swagger */}
                          </td>
                        </tr>
                      ) : (
                        assets.map((asset, idx) => {
                          const ticker = asset.ticker ?? asset.symbol ?? '—';
                          const price = asset.price ?? asset.current_price ?? null;
                          const change = asset.change ?? asset.price_change_percent ?? asset.percent ?? null;
                          const volume = asset.volume ?? asset.quantity ?? asset.amount ?? '—';
                          const imc = asset.initialMarginCost ?? asset.initial_margin_cost ?? null;
                          const acqDate = asset.acquisitionDate ?? asset.acquisition_date ?? null;

                          return (
                            <tr key={asset.id ?? asset.asset_id ?? idx}>
                              <td className={styles.ticker}>{ticker}</td>
                              <td>{price != null ? formatRSD(price) : '—'}</td>
                              <td className={change != null && Number(change) >= 0 ? styles.positive : styles.negative}>
                                {change != null ? formatPercent(change) : '—'}
                              </td>
                              <td>{volume}</td>
                              <td>{imc != null ? formatRSD(imc) : '—'}</td>
                              <td>{formatDate(acqDate)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Performance placeholder ── */}
            <section className={`page-anim ${styles.card}`}>
              <div className={styles.sectionHeader}>
                <div>
                  <div className={styles.eyebrow}>Performanse</div>
                  <h2 className={styles.sectionTitle}>Istorija performansi</h2>
                </div>
              </div>

              {performance ? (
                <div style={{ padding: '16px 20px', fontSize: 14 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--tx-2)' }}>
                    {JSON.stringify(performance, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className={styles.placeholderSection}>
                  <div className={styles.placeholderIcon}>📈</div>
                  <p className={styles.placeholderText}>
                    Performanse fonda (mesečne / kvartalne / godišnje) biće dostupne
                    kada backend doda odgovarajući endpoint.
                    {/* TODO: Replace placeholder once GET /investment-funds/{id}/performance is confirmed */}
                  </p>
                  <div className={styles.placeholderGrid}>
                    <div className={styles.placeholderCard}>
                      <span>Mesečno</span>
                      <strong>—</strong>
                    </div>
                    <div className={styles.placeholderCard}>
                      <span>Kvartalno</span>
                      <strong>—</strong>
                    </div>
                    <div className={styles.placeholderCard}>
                      <span>Godišnje</span>
                      <strong>—</strong>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── Invest modal ── */}
      {investOpen && (
        <div className={styles.modalBackdrop} onClick={() => setInvestOpen(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Investiraj u fond</h3>
                <p className={styles.modalText}>
                  Fond: <strong>{fund?.name ?? fund?.fund_name}</strong>
                </p>
              </div>
              <button
                className={styles.closeIconButton}
                onClick={() => setInvestOpen(false)}
              >
                ×
              </button>
            </div>

            <form className={styles.modalBody} onSubmit={handleInvestSubmit}>
              {/* Account selector */}
              <div className={styles.field}>
                <label>
                  Račun <span className={styles.required}>*</span>
                </label>
                <select
                  value={investAccountNumber}
                  onChange={e => setInvestAccountNumber(e.target.value)}
                  required
                >
                  <option value="">
                    {accountsLoading ? 'Učitavanje računa...' : 'Izaberite račun...'}
                  </option>
                  {accounts.map((acc, i) => {
                    const num =
                      acc.AccountNumber ??
                      acc.account_number ??
                      acc.accountNumber ??
                      acc.number ??
                      '';
                    const name =
                      acc.Name ??
                      acc.name ??
                      acc.owner_name ??
                      acc.ownerName ??
                      `Račun ${i + 1}`;
                    const bal =
                      acc.Balance ??
                      acc.AvailableBalance ??
                      acc.balance ??
                      acc.available_balance;
                    const cur = acc.Currency?.Code ?? acc.currency ?? '';
                    return (
                      <option key={num || i} value={num}>
                        {name}{num ? ` — ${num}` : ''}
                        {bal != null
                          ? ` (${Number(bal).toLocaleString('sr-RS', { minimumFractionDigits: 2 })}${cur ? ` ${cur}` : ''})`
                          : ''}
                      </option>
                    );
                  })}
                </select>
                {!accountsLoading && accounts.length === 0 && (
                  <p className={styles.fieldHint} style={{ color: 'var(--red)' }}>
                    Nemate aktivnih računa.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className={styles.field}>
                <label>
                  Iznos (RSD) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Unesite iznos..."
                  value={investAmount}
                  onChange={e => setInvestAmount(e.target.value)}
                  required
                />
                {fund?.minimumInvestment || fund?.minimum_investment ? (
                  <p className={styles.fieldHint}>
                    Minimalni ulog:{' '}
                    {formatRSD(fund.minimumInvestment ?? fund.minimum_investment)}
                  </p>
                ) : null}
              </div>

              {/* Inline feedback inside modal */}
              {feedback?.type === 'greska' && (
                <Alert tip="greska" poruka={feedback.text} />
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setInvestOpen(false)}
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={investSubmitting}
                >
                  {investSubmitting ? 'Slanje...' : 'Potvrdi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
