import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Badge from '../components/ui/Badge.jsx';
import { apiMessage } from '../utils/apiError.js';

export default function ProfilePage() {
  const { syncUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [banner, setBanner] = useState({ type: '', text: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/me');
        if (!cancelled) {
          setProfile(res.data.data);
          setName(res.data.data.name || '');
          setEmail(res.data.data.email || '');
        }
      } catch (e) {
        if (!cancelled)
          setBanner({ type: 'error', text: apiMessage(e) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveBasics = async (e) => {
    e.preventDefault();
    setSavingBasic(true);
    setBanner({ type: '', text: '' });
    try {
      const res = await api.put('/users/me', { name, email });
      const nextProfile = res.data.data;
      setProfile(nextProfile);
      syncUser({
        id: nextProfile.id,
        name: nextProfile.name,
        email: nextProfile.email,
        role: nextProfile.role,
      });
      setBanner({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setBanner({ type: 'error', text: apiMessage(err) });
    } finally {
      setSavingBasic(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    setBanner({ type: '', text: '' });
    try {
      await api.patch('/users/me/password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setBanner({ type: 'success', text: 'Password rotated successfully.' });
    } catch (err) {
      setBanner({ type: 'error', text: apiMessage(err) });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading || !profile) {
    return <Spinner />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Profile & security</h2>
        <p className="mt-2 text-sm text-slate-400">
          Maintain accurate contact fields so teammate invites land in the right inbox.
        </p>
      </div>

      {banner.text && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.type === 'success'
              ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-100'
              : 'border-rose-500/40 bg-rose-950/50 text-rose-100'
          }`}
        >
          {banner.text}
        </div>
      )}

      <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-brand-950/70 to-transparent p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
            {profile.name.slice(0, 1)}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{profile.name}</p>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>
          <Badge variant="role">{profile.role}</Badge>
        </div>
        <dl className="mt-6 grid gap-4 text-xs text-slate-500 sm:grid-cols-2">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-600">Account id</dt>
            <dd className="mt-1 font-mono text-sm text-white">{profile.id}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-600">Joined</dt>
            <dd className="mt-1 text-sm text-white">
              {profile.createdAt && new Date(profile.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </article>

      <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5" onSubmit={saveBasics}>
        <div>
          <h3 className="text-lg font-semibold text-white">Basic profile</h3>
          <p className="text-xs text-slate-500">
            Mirrors the fields stored for every collaborator in MongoDB.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          disabled={savingBasic}
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {savingBasic ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-5" onSubmit={changePassword}>
        <h3 className="text-lg font-semibold text-white">Password rotation</h3>
        <p className="text-xs text-slate-500">Same complexity rules enforced during signup.</p>
        <div>
          <label className="text-xs font-medium text-slate-300">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300">New password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          disabled={savingPw}
          type="submit"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-40"
        >
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
