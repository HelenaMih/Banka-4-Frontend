import { useState, useRef, useLayoutEffect }  from 'react';
import { useParams, useNavigate, Link }        from 'react-router-dom';
import gsap                                    from 'gsap';
import { useFetch }                            from '../hooks/useFetch';
import { employeesApi }                        from '../api/endpoints/employees';
import { jeObavezno, jeValidanEmail, jeValidanTelefon } from '../utils/helpers';
import { useAuthStore }                        from '../store/authStore';
import Navbar                                  from '../components/layout/Navbar';
import Spinner                                 from '../components/ui/Spinner';
import Alert                                   from '../components/ui/Alert';
import styles                                  from './EmployeeDetails.module.css';

const GENDER_OPTIONS = ['M', 'F'];

export default function EmployeeDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const pageRef  = useRef(null);
  const user     = useAuthStore(s => s.user);

  const { data, loading, error, refetch } = useFetch(
    () => employeesApi.getById(id),
    [id]
  );

  const [editMode,   setEditMode]   = useState(false);
  const [form,       setForm]       = useState(null);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
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
  }, []);

  function startEdit() {
    const emp = data.data;
    setForm({
      first_name:    emp.first_name ?? '',
      last_name:     emp.last_name ?? '',
      email:         emp.email ?? '',
      phone_number:  emp.phone_number ?? '',
      address:       emp.address ?? '',
      date_of_birth: emp.date_of_birth ?? '',
      gender:        emp.gender ?? '',
      active:        emp.active ?? true,
      position_id:   emp.position_id ?? '',
      department:    emp.department ?? '',
    });
    setErrors({});
    setApiError(null);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setForm(null);
    setErrors({});
    setApiError(null);
  }

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  }

  function validate() {
    const e = {};
    const check = (k, err) => { if (err) e[k] = err; };
    check('first_name', jeObavezno(form.first_name));
    check('last_name',  jeObavezno(form.last_name));
    check('email',      jeObavezno(form.email) ?? jeValidanEmail(form.email));
    check('position_id', jeObavezno(form.position_id));
    check('department', jeObavezno(form.department));
    if (form.phone_number && jeValidanTelefon(form.phone_number)) {
      e.phone_number = jeValidanTelefon(form.phone_number);
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await employeesApi.update(id, form);
      setEditMode(false);
      refetch();
    } catch (err) {
      setApiError(err.error ?? 'Greška pri čuvanju.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog zaposlenog?')) return;
    try {
      await employeesApi.remove(id);
      navigate('/employees');
    } catch (err) {
      setApiError(err.error ?? 'Greška pri brisanju.');
    }
  }

  if (loading) return <><Navbar /><Spinner /></>;
  if (error)   return <><Navbar /><Alert tip="greska" poruka={error.error ?? 'Greška.'} /></>;
  if (!data?.data) return <><Navbar /><Alert tip="greska" poruka="Zaposleni nije pronađen." /></>;

  const emp = data.data;

  return (
    <div ref={pageRef} className={styles.stranica}>
      <Navbar />

      <main className={styles.sadrzaj}>
        <div className="page-anim">
          <div className={styles.breadcrumb}>
            <Link to="/employees" className={styles.breadcrumbLink}>Zaposleni</Link>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbActive}>{emp.first_name} {emp.last_name}</span>
          </div>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>{emp.first_name} {emp.last_name}</h1>
              <p className={styles.pageDesc}>ID Pozicije: {emp.position_id} — {emp.department}</p>
            </div>
            {user?.is_admin && !editMode && (
              <div className={styles.headerActions}>
                <button className={styles.btnPrimary} onClick={startEdit}>
                  Izmeni
                </button>
                <button className={styles.btnDanger} onClick={handleDelete}>
                  Obriši
                </button>
              </div>
            )}
          </div>
        </div>

        {apiError && <Alert tip="greska" poruka={apiError} />}

        <div className={`page-anim ${styles.detailCard}`}>
          {editMode ? (
            <form onSubmit={handleSave} noValidate>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Lični podaci</div>
                <div className={styles.fieldGrid}>
                  <Field label="Ime" required error={errors.first_name}>
                    <input type="text" value={form.first_name} onChange={e => updateField('first_name', e.target.value)} className={form.first_name ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Prezime" required error={errors.last_name}>
                    <input type="text" value={form.last_name} onChange={e => updateField('last_name', e.target.value)} className={form.last_name ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className={form.email ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Telefon" error={errors.phone_number}>
                    <input type="tel" value={form.phone_number} onChange={e => updateField('phone_number', e.target.value)} className={form.phone_number ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Adresa">
                    <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} className={form.address ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Datum rođenja">
                    <input type="date" value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} className={form.date_of_birth ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Pol">
                    <select value={form.gender} onChange={e => updateField('gender', e.target.value)} className={form.gender ? styles.hasValue : ''}>
                      <option value="">Izaberite...</option>
                      {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o === 'M' ? 'Muški' : 'Ženski'}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Radno mesto</div>
                <div className={styles.fieldGrid}>
                  <Field label="ID Pozicije" required error={errors.position_id}>
                    <input type="number" value={form.position_id} onChange={e => updateField('position_id', e.target.value)} className={form.position_id ? styles.hasValue : ''} />
                  </Field>
                  <Field label="Departman" required error={errors.department}>
                    <input type="text" value={form.department} onChange={e => updateField('department', e.target.value)} className={form.department ? styles.hasValue : ''} />
                  </Field>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnGhost} onClick={cancelEdit}>Otkaži</button>
                <button type="submit" disabled={submitting} className={styles.btnPrimary}>
                  {submitting ? 'Čuvanje...' : 'Sačuvaj izmene'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Lični podaci</div>
                <div className={styles.fieldGrid}>
                  <ViewField label="Ime" value={emp.first_name} />
                  <ViewField label="Prezime" value={emp.last_name} />
                  <ViewField label="Email" value={emp.email} />
                  <ViewField label="Telefon" value={emp.phone_number || '—'} />
                  <ViewField label="Adresa" value={emp.address || '—'} />
                  <ViewField label="Datum rođenja" value={emp.date_of_birth || '—'} />
                  <ViewField label="Pol" value={emp.gender === 'M' ? 'Muški' : emp.gender === 'F' ? 'Ženski' : '—'} />
                  <div>
                    <div className={styles.fieldLabel}>Status</div>
                    <span className={`${styles.badge} ${emp.active ? styles.badgeActive : styles.badgeInactive}`}>
                      {emp.active ? 'Aktivan' : 'Neaktivan'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionTitle}>Radno mesto</div>
                <div className={styles.fieldGrid}>
                  <ViewField label="ID Pozicije" value={emp.position_id} />
                  <ViewField label="Departman" value={emp.department} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ViewField({ label, value }) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className={styles.field}>
      <label>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {error && <span className={styles.greska}>{error}</span>}
    </div>
  );
}
