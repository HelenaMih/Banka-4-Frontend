import api from './client';

const DELAY = 600;

const delay = ms => new Promise(r => setTimeout(r, ms));

const FAKE_EMPLOYEE = {
  employee_id: 1,
  first_name: 'Petar',
  last_name: 'Petrović',
  email: 'petar.petrovic@rafbank.rs',
  username: 'ppetrovic',
  gender: 'M',
  date_of_birth: '1985-03-15',
  phone_number: '+381601234567',
  address: 'Knez Mihailova 10, Beograd',
  department: 'Management',
  position_id: 1,
  active: true,
  is_admin: true,
  permissions: [
    'employee.view',
    'employee.create',
    'employee.update',
    'employee.delete',
  ],
};

const FAKE_EMPLOYEES = [
  { employee_id: 1, first_name: 'Petar', last_name: 'Petrović', email: 'petar.petrovic@rafbank.rs', username: 'ppetrovic', position_id: 1, department: 'Management', active: true, gender: 'M', date_of_birth: '1985-03-15', phone_number: '+381601234567', address: 'Knez Mihailova 10' },
  { employee_id: 2, first_name: 'Ana', last_name: 'Jovanović', email: 'ana.jovanovic@rafbank.rs', username: 'ajovanovic', position_id: 2, department: 'Finance', active: true, gender: 'F', date_of_birth: '1990-07-22', phone_number: '+381601234568', address: 'Bulevar Kralja Aleksandra 5' },
  { employee_id: 3, first_name: 'Marko', last_name: 'Nikolić', email: 'marko.nikolic@rafbank.rs', username: 'mnikolic', position_id: 3, department: 'IT', active: true, gender: 'M', date_of_birth: '1992-11-03', phone_number: '+381601234569', address: 'Nemanjina 15' },
  { employee_id: 4, first_name: 'Jelena', last_name: 'Đorđević', email: 'jelena.djordjevic@rafbank.rs', username: 'jdjordjevic', position_id: 4, department: 'Finance', active: false, gender: 'F', date_of_birth: '1988-01-10', phone_number: '+381601234570', address: 'Cara Dušana 20' },
  { employee_id: 5, first_name: 'Stefan', last_name: 'Popović', email: 'stefan.popovic@rafbank.rs', username: 'spopovic', position_id: 5, department: 'IT', active: true, gender: 'M', date_of_birth: '1995-05-18', phone_number: '+381601234571', address: 'Terazije 8' },
  { employee_id: 6, first_name: 'Milica', last_name: 'Stanković', email: 'milica.stankovic@rafbank.rs', username: 'mstankovic', position_id: 6, department: 'HR', active: true, gender: 'F', date_of_birth: '1991-09-25', phone_number: '+381601234572', address: 'Savska 30' },
  { employee_id: 7, first_name: 'Nikola', last_name: 'Ilić', email: 'nikola.ilic@rafbank.rs', username: 'nilic', position_id: 7, department: 'IT', active: false, gender: 'M', date_of_birth: '1993-12-07', phone_number: '+381601234573', address: 'Vojvode Stepe 42' },
  { employee_id: 8, first_name: 'Ivana', last_name: 'Marković', email: 'ivana.markovic@rafbank.rs', username: 'imarkovic', position_id: 8, department: 'Finance', active: true, gender: 'F', date_of_birth: '1989-04-14', phone_number: '+381601234574', address: 'Balkanska 12' },
];

const FAKE_PAYMENTS = [
  {
    id: 1,
    date: '2024-03-14 14:20',
    recipient: 'Restoran "Sidro"',
    amount: -4200.00,
    currency: 'RSD',
    status: 'Realizovano',
    type: 'payment',
    fee: 15.00,
    paymentCode: '289',
    model: '97',
    reference: '12-345-678',
    sender_account: '265-0000001234567-89',
    recipient_account: '160-0000009876543-21'
  },
  {
    id: 2,
    date: '2024-03-14 12:15',
    recipient: 'Menjačnica (RSD -> EUR)',
    amount: -11750.00,
    currency: 'RSD',
    status: 'U obradi',
    type: 'exchange',
    fee: 0.00,
    paymentCode: '221',
    model: '00',
    reference: 'TRF-9921',
    sender_account: '265-0000001234567-89',
    recipient_account: '265-0000001234567-44'
  },
  {
    id: 3,
    date: '2024-03-13 09:00',
    recipient: 'Infostan',
    amount: -8500.00,
    currency: 'RSD',
    status: 'Odbijeno',
    type: 'payment',
    fee: 45.00,
    paymentCode: '289',
    model: '11',
    reference: 'INF-2024-X',
    sender_account: '265-0000001234567-89',
    recipient_account: '115-0000000000111-22'
  }
];

api.interceptors.request.use(async config => {
  await delay(DELAY);

  const { method, url, data: rawData, params } = config;
  const data = typeof rawData === 'string' ? JSON.parse(rawData || '{}') : rawData ?? {};
  const path = url?.replace(import.meta.env.VITE_API_URL ?? '', '') ?? '';

  if (method === 'post' && path === '/login') {
    if (data.email && data.password) {
      return throwFakeResponse(config, {
        token: 'fake-jwt-token-123',
        refresh_token: 'fake-refresh-token-123',
        user: FAKE_EMPLOYEE,
      });
    }
    return throwFakeError(config, 401, 'Pogrešan email ili lozinka.');
  }

  if (method === 'post' && path === '/refresh') {
    return throwFakeResponse(config, {
      token: 'fake-jwt-token-123',
      refresh_token: 'fake-refresh-token-123',
    });
  }

  if (method === 'post' && path === '/register') {
    const novi = { employee_id: Date.now(), ...data };
    FAKE_EMPLOYEES.push(novi);
    return throwFakeResponse(config, { data: novi, message: 'Zaposleni je kreiran.' }, 201);
  }

  if (method === 'post' && path === '/activate') {
    return throwFakeResponse(config, { message: 'Nalog je aktiviran.' });
  }

  if (method === 'post' && path === '/forgot-password') {
    return throwFakeResponse(config, { message: 'Email je poslat.' });
  }

  if (method === 'post' && path === '/reset-password') {
    return throwFakeResponse(config, { message: 'Lozinka je promenjena.' });
  }

  if (method === 'post' && path === '/change-password') {
    return throwFakeResponse(config, { message: 'Lozinka je uspešno promenjena.' });
  }

  const idMatch = path.match(/^\/(\d+)$/);

  if (method === 'get' && idMatch) {
    const emp = FAKE_EMPLOYEES.find(e => e.employee_id === Number(idMatch[1]));
    if (emp) {
      return throwFakeResponse(config, { data: emp });
    }
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'patch' && idMatch) {
    const idx = FAKE_EMPLOYEES.findIndex(e => e.employee_id === Number(idMatch[1]));
    if (idx !== -1) {
      Object.assign(FAKE_EMPLOYEES[idx], data);
      return throwFakeResponse(config, { data: FAKE_EMPLOYEES[idx], message: 'Zaposleni je ažuriran.' });
    }
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'delete' && idMatch) {
    const idx = FAKE_EMPLOYEES.findIndex(e => e.employee_id === Number(idMatch[1]));
    if (idx !== -1) {
      FAKE_EMPLOYEES.splice(idx, 1);
      return throwFakeResponse(config, { message: 'Zaposleni je obrisan.' });
    }
    return throwFakeError(config, 404, 'Zaposleni nije pronađen.');
  }

  if (method === 'get' && path === '') {
    let filtered = [...FAKE_EMPLOYEES];

    if (params?.email) {
      filtered = filtered.filter(e => e.email.toLowerCase().includes(params.email.toLowerCase()));
    }
    if (params?.first_name) {
      filtered = filtered.filter(e => e.first_name.toLowerCase().includes(params.first_name.toLowerCase()));
    }
    if (params?.last_name) {
      filtered = filtered.filter(e => e.last_name.toLowerCase().includes(params.last_name.toLowerCase()));
    }
    if (params?.position) {
      filtered = filtered.filter(e => String(e.position_id).includes(params.position));
    }

    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.page_size) || 20;
    const start = (page - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);

    return throwFakeResponse(config, {
      data: sliced,
      total: filtered.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize),
    });
  }

  // --- MOCK LOGIKA ZA PLACANJA ---
  if (path === '/payments' && method === 'get') {
    let filtered = [...FAKE_PAYMENTS];

    // LOG ZA DEBUG (Otvori F12 i vidi šta piše ovde!)
    console.log("Parametri koji su stigli na Mock:", params);

    // 1. Tip
    if (params?.type) {
      filtered = filtered.filter(p => p.type === params.type);
    }

    // 2. Status
    if (params?.status && params.status !== "") {
      filtered = filtered.filter(p => p.status === params.status);
    }

    // 3. Iznos MIN (npr. ako uneseš -5000, prikazaće -4200 jer je -4200 > -5000)
    if (params?.amountFrom && params.amountFrom !== "") {
      const min = Number(params.amountFrom);
      filtered = filtered.filter(p => p.amount >= min);
    }

    // 4. Iznos MAX (npr. ako uneseš -1000, sakriće sve što je "skuplje" od toga)
    if (params?.amountTo && params.amountTo !== "") {
      const max = Number(params.amountTo);
      filtered = filtered.filter(p => p.amount <= max);
    }

    // 5. Datumi (Isto provera za prazne stringove)
    if (params?.dateFrom && params.dateFrom !== "") {
      filtered = filtered.filter(p => new Date(p.date) >= new Date(params.dateFrom));
    }
    if (params?.dateTo && params.dateTo !== "") {
      const dTo = new Date(params.dateTo);
      dTo.setHours(23, 59, 59);
      filtered = filtered.filter(p => new Date(p.date) <= dTo);
    }

    // Paginacija...
    const page = Number(params?.page) || 1;
    const pageSize = Number(params?.page_size) || 20;
    const start = (page - 1) * pageSize;
    const sliced = filtered.slice(start, start + pageSize);

    return throwFakeResponse(config, {
      data: sliced,
      total: filtered.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filtered.length / pageSize),
    });
  }

  // Dobavljanje jedne transakcije po ID-u (za Modal)
  const paymentIdMatch = path.match(/^\/payments\/(\d+)$/);
  if (method === 'get' && paymentIdMatch) {
    const payment = FAKE_PAYMENTS.find(p => p.id === Number(paymentIdMatch[1]));
    if (payment) return throwFakeResponse(config, { data: payment });
    return throwFakeError(config, 404, 'Transakcija nije pronađena.');
  }

  return config;
});

function throwFakeResponse(config, responseData, status = 200) {
  config.adapter = () =>
    Promise.resolve({
      data: responseData,
      status,
      headers: {},
      config,
      request: {},
    });
  return config;
}

function throwFakeError(config, status, errorMsg) {
  config.adapter = () =>
    Promise.reject({
      response: {
        status,
        data: { error: errorMsg },
      },
      config,
    });
  return config;
}
