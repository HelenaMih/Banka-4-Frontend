import { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import Navbar from '../../components/layout/Navbar';
import Alert from '../../components/ui/Alert';
import { useFetch } from '../../hooks/useFetch';
import { investmentFundsApi } from '../../api/endpoints/investmentFunds';
import { accountsApi } from '../../api/endpoints/accounts';
import { portfolioApi } from '../../api/endpoints/portfolio';
import { getErrorMessage } from '../../utils/apiError';
import styles from './ProfitBankPage.module.css';

const TAB = {
  ACTUARIES: 'ACTUARIES',
  FUNDS: 'FUNDS',
};

const ACTION = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW',
};

export default function ProfitBankPage() {
  const pageRef = useRef(null);

  const [activeTab, setActiveTab] = useState(TAB.ACTUARIES);
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedFundId, setSelectedFundId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [modalState, setModalState] = useState({
    open: false,
    type: null,
    fund: null,
  });

  const [form, setForm] = useState({
    bankAccountNumber: '',
    amount: '',
  });

  // Fund assets (holdings)
  const [fundAssets, setFundAssets] = useState(null);
  const [fundAssetsLoading, setFundAssetsLoading] = useState(false);

  // Sell modal for supervisor
  const [sellModal, setSellModal] = useState(null); // asset object
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [sellFeedback, setSellFeedback] = useState(null);

  // Fund profit row from GET /profit/funds
  const [fundProfitRow, setFundProfitRow] = useState(null);

  // Performance data
  const [fundPerformance, setFundPerformance] = useState(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const nodes = pageRef.current?.querySelectorAll('.page-anim');
      if (!nodes?.length) return;

      gsap.from(nodes, {
        opacity: 0,
        y: 20,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, pageRef);

    return () => ctx.revert();
  }, [activeTab, selectedFundId, modalState.open]);

  const {
    data: actuariesResponse,
    loading: actuariesLoading,
    error: actuariesError,
    refetch: refetchActuaries,
  } = useFetch(() => investmentFundsApi.getActuaryPerformances(), []);

  const {
    data: fundsResponse,
    loading: fundsLoading,
    error: fundsError,
    refetch: refetchFunds,
  } = useFetch(() => investmentFundsApi.getFunds({ managed_only: true }), []);

  const {
    data: selectedFundResponse,
    loading: fundDetailsLoading,
    error: fundDetailsError,
    refetch: refetchFundDetails,
  } = useFetch(
    () => (selectedFundId ? investmentFundsApi.getFundDetails(selectedFundId) : Promise.resolve(null)),
    [selectedFundId]
  );

  const {
    data: bankAccountsResponse,
    loading: bankAccountsLoading,
  } = useFetch(() => accountsApi.getAll(), []);

  const {
    data: actuaryPortfolioResponse,
    loading: actuaryPortfolioLoading,
  } = useFetch(() => portfolioApi.getActuaryPortfolio(), []);

  // Load fund assets (holdings) whenever a fund is selected
  useEffect(() => {
    if (!selectedFundId) {
      setFundAssets(null);
      return;
    }
    let alive = true;
    setFundAssetsLoading(true);
    setFundAssets(null);
    investmentFundsApi
      .getFundAssets(selectedFundId)
      .then(res => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
        setFundAssets(list);
      })
      .catch(() => {
        // Endpoint may not exist yet — graceful fallback to empty list
        if (alive) setFundAssets([]);
      })
      .finally(() => { if (alive) setFundAssetsLoading(false); });
    return () => { alive = false; };
  }, [selectedFundId]);

  // Load fund profit row from GET /profit/funds
  useEffect(() => {
    if (!selectedFundId) { setFundProfitRow(null); return; }
    let alive = true;
    investmentFundsApi
      .getFundProfits()
      .then(res => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : res?.data ?? [];
        const row = list.find(
          p => String(p?.fund_id ?? p?.fundId ?? p?.id) === String(selectedFundId)
        );
        setFundProfitRow(row ?? null);
      })
      .catch(() => { /* non-fatal — backend may not have this endpoint */ });
    return () => { alive = false; };
  }, [selectedFundId]);

  // Load performance for selected fund
  useEffect(() => {
    if (!selectedFundId) { setFundPerformance(null); return; }
    let alive = true;
    investmentFundsApi
      .getFundPerformance(selectedFundId)
      .then(res => { if (alive) setFundPerformance(res); })
      .catch(() => { /* endpoint not yet available */ });
    return () => { alive = false; };
  }, [selectedFundId]);

  const actuaries = useMemo(() => {
    const raw = Array.isArray(actuariesResponse)
      ? actuariesResponse
      : actuariesResponse?.data ?? [];

    const next = [...raw];
    next.sort((a, b) => {
      const aProfit = Number(a.profit_rsd ?? 0);
      const bProfit = Number(b.profit_rsd ?? 0);
      return sortDirection === 'desc' ? bProfit - aProfit : aProfit - bProfit;
    });

    return next;
  }, [actuariesResponse, sortDirection]);

  const funds = useMemo(() => {
    return Array.isArray(fundsResponse)
      ? fundsResponse
      : fundsResponse?.data ?? [];
  }, [fundsResponse]);

  const selectedFund = useMemo(() => {
    if (!selectedFundResponse) return null;
    return Array.isArray(selectedFundResponse)
      ? selectedFundResponse[0]
      : selectedFundResponse?.data ?? selectedFundResponse;
  }, [selectedFundResponse]);

  const bankAccounts = useMemo(() => {
    return Array.isArray(bankAccountsResponse)
      ? bankAccountsResponse
      : bankAccountsResponse?.data ?? bankAccountsResponse?.content ?? [];
  }, [bankAccountsResponse]);

  const actuaryPortfolio = useMemo(() => {
    return Array.isArray(actuaryPortfolioResponse)
      ? actuaryPortfolioResponse
      : actuaryPortfolioResponse?.data ?? [];
  }, [actuaryPortfolioResponse]);

  // Derived fund value: liquidity + sum(price * volume of all holdings)
  const derivedFundValue = useMemo(() => {
    if (!selectedFund) return null;
    const liquidity = Number(selectedFund.liquidity_rsd ?? 0);
    if (!fundAssets?.length) return liquidity || null;
    const holdingsValue = fundAssets.reduce((sum, a) => {
      const price = Number(a.price ?? a.current_price ?? 0);
      const volume = Number(a.volume ?? a.quantity ?? a.amount ?? 0);
      return sum + price * volume;
    }, 0);
    return liquidity + holdingsValue;
  }, [selectedFund, fundAssets]);

  // Derived profit: fund value − sum(initialMarginCost)
  const derivedProfit = useMemo(() => {
    if (derivedFundValue == null || !fundAssets?.length) return null;
    const totalMargin = fundAssets.reduce((sum, a) => {
      return sum + Number(a.initialMarginCost ?? a.initial_margin_cost ?? 0);
    }, 0);
    return derivedFundValue - totalMargin;
  }, [derivedFundValue, fundAssets]);

  function openFundAction(type, fund) {
    const firstBankAccount =
      bankAccounts.find(acc =>
        String(acc.account_type ?? acc.accountType ?? '').toLowerCase() === 'fund'
      ) ??
      bankAccounts[0];

    const bankAccountNumber =
      firstBankAccount?.account_number ??
      firstBankAccount?.accountNumber ??
      firstBankAccount?.AccountNumber ??
      '';

    setForm({
      bankAccountNumber,
      amount: '',
    });

    setModalState({
      open: true,
      type,
      fund,
    });
  }

  function closeFundAction() {
    setModalState({
      open: false,
      type: null,
      fund: null,
    });

    setForm({
      bankAccountNumber: '',
      amount: '',
    });
  }

  async function handleSubmitFundAction(e) {
    e.preventDefault();

    const amount = Number(form.amount);
    const fund = modalState.fund;

    if (!form.bankAccountNumber) {
      setFeedback({ type: 'greska', text: 'Izaberite bankovni račun.' });
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'greska', text: 'Unesite validan iznos.' });
      return;
    }

    if (
      modalState.type === ACTION.WITHDRAW &&
      amount > Number(fund?.liquidity_rsd ?? fund?.available_liquidity_rsd ?? 0)
    ) {
      setFeedback({
        type: 'greska',
        text: 'Fond nema dovoljno raspoložive likvidnosti.',
      });
      return;
    }

    try {
      if (modalState.type === ACTION.DEPOSIT) {
        await investmentFundsApi.depositToFund(fund.fund_id, {
          bank_account_number: form.bankAccountNumber,
          amount_rsd: amount,
        });

        setFeedback({ type: 'uspeh', text: 'Uplata u fond je uspešno evidentirana.' });
      } else {
        await investmentFundsApi.withdrawFromFund(fund.fund_id, {
          bank_account_number: form.bankAccountNumber,
          amount_rsd: amount,
        });

        setFeedback({ type: 'uspeh', text: 'Povlačenje iz fonda je uspešno evidentirano.' });
      }

      closeFundAction();
      refetchFunds?.();
      refetchFundDetails?.();
    } catch (err) {
      setFeedback({
        type: 'greska',
        text: getErrorMessage(err, 'Akcija nad fondom nije uspela.'),
      });
    }
  }

  // ── Sell fund asset (supervisor) ────────────────────────────────────────
  async function handleSellAsset() {
    if (!sellModal) return;
    setSellSubmitting(true);
    setSellFeedback(null);
    try {
      await investmentFundsApi.sellFundAsset(selectedFundId, sellModal.id ?? sellModal.asset_id, {
        quantity: sellModal.volume ?? sellModal.quantity ?? sellModal.amount ?? 1,
      });
      setSellFeedback({ type: 'uspeh', text: `Hartija ${sellModal.ticker ?? sellModal.symbol ?? ''} je uspešno prodata.` });
      setSellModal(null);
      // Refresh assets
      setFundAssets(null);
      setFundAssetsLoading(true);
      investmentFundsApi
        .getFundAssets(selectedFundId)
        .then(res => {
          const list = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];
          setFundAssets(list);
        })
        .catch(() => setFundAssets([]))
        .finally(() => setFundAssetsLoading(false));
    } catch (err) {
      setSellFeedback({ type: 'greska', text: getErrorMessage(err, 'Prodaja nije uspela.') });
    } finally {
      setSellSubmitting(false);
    }
  }

  const showActuaries = activeTab === TAB.ACTUARIES;
  const showFunds = activeTab === TAB.FUNDS && !selectedFundId;
  const showFundDetails = activeTab === TAB.FUNDS && !!selectedFundId;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />

      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Profit Banke</span>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbAktivna}>
              {showFundDetails ? 'Detalji fonda' : 'Pregled'}
            </span>
          </div>

          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Profit Banke</h1>
              <p className={styles.pageDesc}>
                Portal dostupan isključivo supervizorima. Sve vrednosti su prikazane u RSD.
              </p>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="page-anim">
            <Alert tip={feedback.type} poruka={feedback.text} />
          </div>
        )}

        <section className={`page-anim ${styles.tabsCard}`}>
          <div className={styles.tabsRow}>
            <button
              type="button"
              className={`${styles.tabButton} ${showActuaries ? styles.tabButtonActive : ''}`}
              onClick={() => {
                setSelectedFundId(null);
                setActiveTab(TAB.ACTUARIES);
              }}
            >
              Profit aktuara
            </button>

            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === TAB.FUNDS ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab(TAB.FUNDS)}
            >
              Pozicije u fondovima
            </button>
          </div>
        </section>

        {showActuaries && (
          <section className={`page-anim ${styles.card}`}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionEyebrow}>Actuary Performances</div>
                <h2 className={styles.sectionTitle}>Tabela svih aktuara</h2>
              </div>

              <button
                type="button"
                className={styles.btnGhost}
                onClick={() =>
                  setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
                }
              >
                Sortiraj po profitu: {sortDirection === 'desc' ? 'Opadajuće' : 'Rastuće'}
              </button>
            </div>

            {actuariesLoading ? (
              <div className={styles.loadingState}>Učitavanje podataka...</div>
            ) : actuariesError ? (
              <div className={styles.inlineState}>
                <Alert tip="greska" poruka={actuariesError?.message || 'Greška pri učitavanju.'} />
                <button type="button" className={styles.btnGhost} onClick={refetchActuaries}>
                  Pokušaj ponovo
                </button>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ime</th>
                        <th>Prezime</th>
                        <th>Pozicija</th>
                        <th>Profit u RSD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actuaries.length === 0 ? (
                        <tr>
                          <td colSpan="4" className={styles.emptyTable}>
                            Nema podataka za prikaz.
                          </td>
                        </tr>
                      ) : (
                        actuaries.map((item) => (
                          <tr key={item.actuary_id}>
                            <td>{item.first_name}</td>
                            <td>{item.last_name}</td>
                            <td>{formatPosition(item.position)}</td>
                            <td>{formatRSD(item.profit_rsd)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '20px 28px 0' }}>
                  <div className={styles.sectionEyebrow} style={{ marginBottom: 10 }}>
                    Portfolio aktuara
                  </div>
                  {actuaryPortfolioLoading ? (
                    <div className={styles.loadingState} style={{ marginTop: 0 }}>
                      Učitavanje portfolija...
                    </div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Ticker</th>
                            <th>Naziv</th>
                            <th>Količina</th>
                            <th>Vrednost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actuaryPortfolio.length === 0 ? (
                            <tr>
                              <td colSpan="4" className={styles.emptyTable}>
                                Nema stavki u portfoliju.
                              </td>
                            </tr>
                          ) : (
                            actuaryPortfolio.map((item, index) => (
                              <tr key={item.id ?? item.asset_id ?? index}>
                                <td>{item.ticker ?? '—'}</td>
                                <td>{item.name ?? item.asset_name ?? '—'}</td>
                                <td>{item.quantity ?? item.volume ?? '—'}</td>
                                <td>{formatRSD(item.value_rsd ?? item.total_value_rsd ?? item.current_value ?? 0)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {showFunds && (
          <section className={`page-anim ${styles.card}`}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionEyebrow}>Investment Funds Positions</div>
                <h2 className={styles.sectionTitle}>Pozicije banke u fondovima</h2>
              </div>
            </div>

            {fundsLoading ? (
              <div className={styles.loadingState}>Učitavanje fondova...</div>
            ) : fundsError ? (
              <div className={styles.inlineState}>
                <Alert tip="greska" poruka={fundsError?.message || 'Greška pri učitavanju fondova.'} />
                <button type="button" className={styles.btnGhost} onClick={refetchFunds}>
                  Pokušaj ponovo
                </button>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Naziv fonda</th>
                      <th>Ime i prezime menadžera</th>
                      <th>Udeo banke (%)</th>
                      <th>Udeo banke (RSD)</th>
                      <th>Profit u RSD</th>
                      <th>Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funds.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={styles.emptyTable}>
                          Nema fondova za prikaz.
                        </td>
                      </tr>
                    ) : (
                      funds.map((fund) => (
                        <tr key={fund.fund_id}>
                          <td>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => setSelectedFundId(fund.fund_id)}
                            >
                              {fund.name}
                            </button>
                          </td>
                          <td>
                            {fund.manager?.first_name} {fund.manager?.last_name}
                          </td>
                          <td>{formatPercent(fund.bank_share_percent)}</td>
                          <td>{formatRSD(fund.bank_share_rsd)}</td>
                          <td>{formatRSD(fund.profit_rsd)}</td>
                          <td>
                            <div className={styles.actionRow}>
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={() => openFundAction(ACTION.DEPOSIT, fund)}
                              >
                                Uplata u fond
                              </button>
                              <button
                                type="button"
                                className={styles.btnGhost}
                                onClick={() => openFundAction(ACTION.WITHDRAW, fund)}
                              >
                                Povlačenje iz fonda
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {showFundDetails && (
          <section className={`page-anim ${styles.card}`}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionEyebrow}>Detaljan prikaz fonda</div>
                <h2 className={styles.sectionTitle}>{selectedFund?.name || 'Fond'}</h2>
              </div>

              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setSelectedFundId(null)}
              >
                Nazad na fondove
              </button>
            </div>

            {fundDetailsLoading ? (
              <div className={styles.loadingState}>Učitavanje detalja fonda...</div>
            ) : fundDetailsError ? (
              <div className={styles.inlineState}>
                <Alert tip="greska" poruka={fundDetailsError?.message || 'Greška pri učitavanju detalja fonda.'} />
                <button type="button" className={styles.btnGhost} onClick={refetchFundDetails}>
                  Pokušaj ponovo
                </button>
              </div>
            ) : !selectedFund ? (
              <div className={styles.loadingState}>Nema detalja fonda.</div>
            ) : (
              <>
                {/* ── Info grid ── */}
                <div className={styles.detailGrid}>
                  <InfoCard
                    label="Menadžer"
                    value={`${selectedFund.manager?.first_name ?? ''} ${selectedFund.manager?.last_name ?? ''}`.trim() || '—'}
                  />
                  <InfoCard label="Udeo banke (%)" value={formatPercent(selectedFund.bank_share_percent)} />
                  <InfoCard label="Udeo banke (RSD)" value={formatRSD(selectedFund.bank_share_rsd)} />
                  <InfoCard
                    label="Vrednost fonda"
                    value={derivedFundValue != null ? formatRSD(derivedFundValue) : '—'}
                  />
                  <InfoCard
                    label="Profit u RSD"
                    value={
                      derivedProfit != null
                        ? formatRSD(derivedProfit)
                        : formatRSD(
                            fundProfitRow?.profit_rsd ??
                            fundProfitRow?.profit ??
                            selectedFund.profit_rsd ??
                            null
                          )
                    }
                  />
                  <InfoCard label="Dostupna likvidnost" value={formatRSD(selectedFund.liquidity_rsd)} />
                  <InfoCard label="Opis" value={selectedFund.description || '—'} />
                </div>

                <div className={styles.sectionDivider} />

                {/* ── Holdings / Assets table ── */}
                <div style={{ padding: '0 0 0 0' }}>
                  <div style={{ padding: '16px 28px 12px' }}>
                    <div className={styles.sectionEyebrow}>Sastav fonda</div>
                    <h3 className={styles.subTitle} style={{ marginBottom: 0 }}>Hartije u fondu</h3>
                  </div>

                  {sellFeedback && (
                    <div style={{ padding: '0 28px 12px' }}>
                      <Alert tip={sellFeedback.type} poruka={sellFeedback.text} />
                    </div>
                  )}

                  {fundAssetsLoading ? (
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
                            <th>Akcija</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!fundAssets || fundAssets.length === 0 ? (
                            <tr>
                              <td colSpan={7} className={styles.emptyTable}>
                                {/* Placeholder until GET /investment-funds/{id}/assets is confirmed working */}
                                Nema dostupnih hartija za ovaj fond.
                              </td>
                            </tr>
                          ) : (
                            fundAssets.map((asset, idx) => {
                              const ticker = asset.ticker ?? asset.symbol ?? '—';
                              const price = asset.price ?? asset.current_price ?? null;
                              const change = asset.change ?? asset.price_change_percent ?? asset.percent ?? null;
                              const volume = asset.volume ?? asset.quantity ?? asset.amount ?? '—';
                              const imc = asset.initialMarginCost ?? asset.initial_margin_cost ?? null;
                              const acqDate = asset.acquisitionDate ?? asset.acquisition_date ?? null;

                              return (
                                <tr key={asset.id ?? asset.asset_id ?? idx}>
                                  <td style={{ fontWeight: 700 }}>{ticker}</td>
                                  <td>{price != null ? formatRSD(price) : '—'}</td>
                                  <td style={{ color: change != null && Number(change) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                                    {change != null ? formatPercent(change) : '—'}
                                  </td>
                                  <td>{volume}</td>
                                  <td>{imc != null ? formatRSD(imc) : '—'}</td>
                                  <td>
                                    {acqDate
                                      ? (() => { try { return new Date(acqDate).toLocaleDateString('sr-RS'); } catch { return String(acqDate); } })()
                                      : '—'}
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className={styles.btnPrimary}
                                      style={{ background: '#ef4444', height: 34, fontSize: 13, padding: '0 14px', boxShadow: 'none' }}
                                      onClick={() => { setSellFeedback(null); setSellModal(asset); }}
                                    >
                                      Prodaj
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className={styles.sectionDivider} />

                {/* ── Performance section ── */}
                <div style={{ padding: '0 28px 24px' }}>
                  <div className={styles.sectionEyebrow} style={{ marginBottom: 8 }}>Performanse</div>
                  {fundPerformance ? (
                    <pre style={{ margin: 0, fontSize: 13, color: 'var(--tx-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(fundPerformance, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {['Mesečno', 'Kvartalno', 'Godišnje'].map(label => (
                        <div key={label} style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '14px 22px',
                          textAlign: 'center',
                          minWidth: 100,
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--tx-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx-2)' }}>—</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* TODO: Remove placeholder once GET /investment-funds/{id}/performance is confirmed in Swagger */}
                </div>

                <div className={styles.sectionDivider} />

                <div className={styles.accountsBlock}>
                  <h3 className={styles.subTitle}>Bankovni račun fonda</h3>

                  {selectedFund.fund_account ? (
                    <div className={styles.accountItem}>
                      <strong>{selectedFund.fund_account.name || 'Račun fonda'}</strong>
                      <span>{selectedFund.fund_account.account_number}</span>
                    </div>
                  ) : (
                    <div className={styles.accountItem}>
                      <strong>Nema povezanog računa</strong>
                      <span>—</span>
                    </div>
                  )}
                </div>

                <div className={styles.sectionDivider} />

                <div className={styles.actionRow} style={{ padding: '0 28px 28px' }}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => openFundAction(ACTION.DEPOSIT, selectedFund)}
                  >
                    Uplata u fond
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    onClick={() => openFundAction(ACTION.WITHDRAW, selectedFund)}
                  >
                    Povlačenje iz fonda
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {modalState.open && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  {modalState.type === ACTION.DEPOSIT ? 'Uplata u fond' : 'Povlačenje iz fonda'}
                </h3>
                <p className={styles.modalText}>
                  Fond: <strong>{modalState.fund?.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className={styles.closeIconButton}
                onClick={closeFundAction}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitFundAction} className={styles.modalBody}>
              <div className={styles.fieldGrid2}>
                <Polje label="Bankovni račun" required>
                  <select
                    value={form.bankAccountNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        bankAccountNumber: e.target.value,
                      }))
                    }
                  >
                    <option value="">
                      {bankAccountsLoading ? 'Učitavanje računa...' : 'Izaberite račun...'}
                    </option>

                    {bankAccounts.map((account, index) => {
                      const number =
                        account.account_number ??
                        account.accountNumber ??
                        account.AccountNumber ??
                        '';

                      const name =
                        account.name ??
                        account.Name ??
                        account.owner_name ??
                        `Račun ${index + 1}`;

                      return (
                        <option key={number || index} value={number}>
                          {name}{number ? ` — ${number}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </Polje>

                <Polje label="Iznos u RSD" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </Polje>
              </div>

              {modalState.type === ACTION.WITHDRAW && (
                <div className={styles.infoStrip}>
                  Dostupna likvidnost fonda:{' '}
                  {formatRSD(
                    modalState.fund?.liquidity_rsd ??
                    modalState.fund?.available_liquidity_rsd ??
                    0
                  )}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={closeFundAction}>
                  Otkaži
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  Potvrdi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Sell confirmation modal (supervisor) ── */}
      {sellModal && (
        <SellConfirmModal
          asset={sellModal}
          onConfirm={handleSellAsset}
          onCancel={() => { setSellModal(null); setSellFeedback(null); }}
          submitting={sellSubmitting}
          feedback={sellFeedback}
        />
      )}
    </div>
  );
}

function SellConfirmModal({ asset, onConfirm, onCancel, submitting, feedback }) {
  if (!asset) return null;
  const ticker = asset.ticker ?? asset.symbol ?? '—';
  const volume = asset.volume ?? asset.quantity ?? asset.amount ?? '—';

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Potvrda prodaje</h3>
            <p className={styles.modalText}>
              Hartija: <strong>{ticker}</strong> — Količina: <strong>{volume}</strong>
            </p>
          </div>
          <button type="button" className={styles.closeIconButton} onClick={onCancel}>×</button>
        </div>

        <div className={styles.modalBody}>
          <p style={{ fontSize: 14, color: 'var(--tx-2)', margin: 0 }}>
            Da li ste sigurni da želite da prodate hartiju <strong>{ticker}</strong> iz fonda?
          </p>

          {feedback && (
            <Alert tip={feedback.type} poruka={feedback.text} />
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onCancel} disabled={submitting}>
              Otkaži
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ background: '#ef4444' }}
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? 'Slanje...' : 'Potvrdi prodaju'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Polje({ label, required, children }) {
  return (
    <div className={styles.field}>
      <label>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <strong className={styles.infoValue}>{value}</strong>
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

function formatPercent(value) {
  if (value == null) return '—';
  return `${new Intl.NumberFormat('sr-RS', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value))}%`;
}

function formatPosition(value) {
  if (!value) return '—';
  if (value === 'SUPERVISOR') return 'Supervizor';
  if (value === 'AGENT') return 'Agent';
  return value;
}