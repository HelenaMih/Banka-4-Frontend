import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import gsap                from 'gsap';
import { actuariesApi }   from '../../api/endpoints/actuaries';
import Navbar             from '../../components/layout/Navbar';
import Spinner            from '../../components/ui/Spinner';
import Alert              from '../../components/ui/Alert';
import ActuaryFilters     from '../../features/actuaries/ActuaryFilters';
import ActuaryTable       from '../../features/actuaries/ActuaryTable';
import LimitModal         from '../../features/actuaries/LimitModal';
import styles             from './ActuariesPage.module.css';

const EMPTY_FILTERS = { email: '', first_name: '', last_name: '', position: '' };

export default function ActuariesPage() {
  const pageRef = useRef(null);

  const [actuaries,  setActuaries]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [feedback, setFeedback] = useState(null);

  // Limit modal state
  const [limitOpen,    setLimitOpen]    = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);
  const [selectedActuary, setSelectedActuary] = useState(null);

  const load = useCallback((params = {}) => {
    setLoading(true);
    setFetchError(null);
    const queryParams = { page: 1, pageSize: 100, ...params };
    actuariesApi.getAll(queryParams)
      .then(res => {
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setActuaries(list);
      })
      .catch(err => setFetchError(err?.response?.data?.error ?? err?.message ?? 'Greška pri učitavanju aktuara.'))
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useLayoutEffect(() => {
    load();
  }, [load]);

  // Animate on mount
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.page-anim', { opacity: 0, y: 20, duration: 0.45, stagger: 0.07, ease: 'power2.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    const params = Object.fromEntries(
      Object.entries(newFilters).filter(([, v]) => v.trim() !== '')
    );
    load(params);
  }

  function handleOpenChangeLimit(actuary) {
    setSelectedActuary(actuary);
    setLimitOpen(true);
  }

  async function handleConfirmLimit(newLimit) {
    setLimitLoading(true);
    try {
      await actuariesApi.changeLimit(selectedActuary.id, newLimit);
      setActuaries(prev =>
        prev.map(a => a.id === selectedActuary.id ? { ...a, limit: newLimit } : a)
      );
      setFeedback({ type: 'uspeh', text: 'Limit je uspešno promenjen.' });
      setLimitOpen(false);
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.response?.data?.error ?? err?.message ?? 'Greška pri promeni limita.' });
    } finally {
      setLimitLoading(false);
    }
  }

  async function handleResetUsedLimit(actuary) {
    try {
      await actuariesApi.resetUsedLimit(actuary.id);
      setActuaries(prev =>
        prev.map(a => a.id === actuary.id ? { ...a, used_limit: 0 } : a)
      );
      setFeedback({ type: 'uspeh', text: `Iskorišćen limit za ${actuary.first_name} ${actuary.last_name} je resetovan.` });
    } catch (err) {
      setFeedback({ type: 'greska', text: err?.response?.data?.error ?? err?.message ?? 'Greška pri resetovanju limita.' });
    }
  }

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />
      <main className={styles.sadrzaj}>

        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <span>Admin</span><span className={styles.sep}>›</span>
            <span className={styles.current}>Aktuari</span>
          </div>
          <h1 className={styles.title}>Aktuari</h1>
          <p className={styles.desc}>
            Pregled i upravljanje aktuarima — postavljanje limita i resetovanje iskorišćenih iznosa.
          </p>
        </div>

        <section className="page-anim">
          <ActuaryFilters filters={filters} onFilterChange={handleFilterChange} />
        </section>

        <section className="page-anim">
          {feedback && <Alert tip={feedback.type} poruka={feedback.text} />}

          {loading && <Spinner />}

          {!loading && fetchError && (
            <Alert tip="greska" poruka={fetchError} />
          )}

          {!loading && !fetchError && (
            <ActuaryTable
              actuaries={actuaries}
              onChangeLimit={handleOpenChangeLimit}
              onResetUsedLimit={handleResetUsedLimit}
            />
          )}
        </section>

      </main>

      <LimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        onConfirm={handleConfirmLimit}
        actuary={selectedActuary}
        loading={limitLoading}
      />
    </div>
  );
}
