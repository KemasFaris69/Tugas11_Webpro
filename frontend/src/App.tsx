import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
};

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  const [token, setToken] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function request(
    path: string,
    options: RequestInit = {},
    auth = token,
  ) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...options.headers,
      },
    });
    const body = await response.json().catch(() => ({}));

    if (response.status === 401 && auth) {
      setToken('');
      setTasks([]);
      throw Error('Sesi berakhir, silakan login kembali.');
    }

    if (!response.ok) {
      throw Error(
        response.status === 429
          ? 'Terlalu banyak percobaan. Coba lagi dalam satu menit.'
          : Array.isArray(body.message)
            ? body.message.join(', ')
            : body.message || `HTTP ${response.status}`,
      );
    }

    return body;
  }

  async function load(auth = token) {
    try {
      setTasks(await request('/tasks', {}, auth));
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  useEffect(() => {
    if (token) {
      void load(token);
    }
  }, [token]);

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'register') {
        await request(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          },
          '',
        );
        setMode('login');
        setNotice('Registrasi berhasil. Silakan login.');
      } else {
        const result = await request(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          },
          '',
        );
        setToken(result.accessToken);
        setPassword('');
      }
    } catch (authError) {
      setError((authError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    try {
      await request('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      setTitle('');
      setDescription('');
      await load();
    } catch (addError) {
      setError((addError as Error).message);
    }
  }

  async function toggle(task: Task) {
    try {
      await request(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !task.completed }),
      });
      await load();
    } catch (toggleError) {
      setError((toggleError as Error).message);
    }
  }

  async function edit(task: Task) {
    const value = prompt('Ubah judul tugas:', task.title);
    if (value === null) return;

    try {
      await request(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: value }),
      });
      await load();
    } catch (editError) {
      setError((editError as Error).message);
    }
  }

  async function remove(task: Task) {
    if (!confirm('Hapus tugas ini?')) return;

    try {
      await request(`/tasks/${task.id}`, {
        method: 'DELETE',
      });
      await load();
    } catch (removeError) {
      setError((removeError as Error).message);
    }
  }

  function logout() {
    setToken('');
    setTasks([]);
    setEmail('');
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setNotice('');
  }

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <ShieldCheck size={26} />
          SecureTask
        </div>
        {token && (
          <button className="logout" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        )}
      </header>

      <main>
        {!token ? (
          <section className="auth card">
            <div className="eyebrow">JWT AUTH • NESTJS • POSTGRESQL</div>
            <h1>{mode === 'login' ? 'Selamat datang' : 'Buat akun baru'}</h1>
            <p className="muted">Kelola tugas pribadi dengan aman.</p>

            <form onSubmit={submitAuth}>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                />
              </label>

              <button className="primary" disabled={busy}>
                {busy
                  ? 'Memproses...'
                  : mode === 'login'
                    ? 'Masuk'
                    : 'Daftar'}
              </button>
            </form>

            <p className="switch">
              {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button onClick={switchMode}>
                {mode === 'login' ? 'Registrasi' : 'Login'}
              </button>
            </p>

            {notice && <div className="notice">{notice}</div>}
            {error && <div className="error">{error}</div>}
          </section>
        ) : (
          <section className="dashboard">
            <div className="heading">
              <div>
                <div className="eyebrow">DASHBOARD</div>
                <h1>Tugas Saya</h1>
                <p className="muted">
                  {tasks.filter((task) => task.completed).length} dari{' '}
                  {tasks.length} tugas selesai
                </p>
              </div>
            </div>

            <form className="add card" onSubmit={add}>
              <label>
                Judul tugas
                <input
                  required
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Contoh: Kerjakan tugas PPW"
                />
              </label>

              <label>
                Deskripsi (opsional)
                <input
                  maxLength={1000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Detail tugas..."
                />
              </label>

              <button className="primary">
                <Plus size={18} />
                Tambah tugas
              </button>
            </form>

            {error && <div className="error">{error}</div>}

            <div className="tasklist">
              {tasks.length === 0 ? (
                <div className="empty card">
                  Belum ada tugas. Tambahkan tugas pertamamu!
                </div>
              ) : (
                tasks.map((task) => (
                  <div className="task card" key={task.id}>
                    <button
                      className="toggle"
                      onClick={() => toggle(task)}
                      aria-label="Ubah status"
                    >
                      {task.completed ? (
                        <CheckCircle2 color="#168b70" />
                      ) : (
                        <Circle color="#8291a7" />
                      )}
                    </button>

                    <div className="tasktext">
                      <strong className={task.completed ? 'done' : ''}>
                        {task.title}
                      </strong>
                      {task.description && (
                        <p className="muted">{task.description}</p>
                      )}
                    </div>

                    <button
                      className="iconbtn"
                      onClick={() => edit(task)}
                      aria-label="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="iconbtn"
                      onClick={() => remove(task)}
                      aria-label="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
