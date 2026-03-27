import styles from './CardStatusBadge.module.css';

const STATUS_MAP = {
  AKTIVNA:     { mod: 'green', label: 'Aktivna'   },
  ACTIVE:      { mod: 'green', label: 'Aktivna'   },
  BLOKIRANA:   { mod: 'red',   label: 'Blokirana' },
  BLOCKED:     { mod: 'red',   label: 'Blokirana' },
  NEAKTIVNA:   { mod: 'gray',  label: 'Neaktivna' },
  INACTIVE:    { mod: 'gray',  label: 'Neaktivna' },
  DEACTIVATED: { mod: 'gray',  label: 'Neaktivna' },
};

export default function CardStatusBadge({ status }) {
  const { mod, label } = STATUS_MAP[status] ?? { mod: 'gray', label: status };
  return (
    <span className={`${styles.badge} ${styles[mod]}`}>
      {label}
    </span>
  );
}
