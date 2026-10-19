import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { useToast } from '../ui/Toast.jsx';
import { formatBaht } from '../components/status.js';
import { localizedName } from '../i18n/index.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';

// จัดการเมนู (เฉพาะ admin): ดูรายการ + เพิ่มเมนูใหม่
export default function MenuAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t } = useLang();
  const [menus, setMenus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ item_name: '', item_name_en: '', category: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMenus(await api.getMenus());
      setLoadError('');
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api.createMenu({
        item_name: form.item_name.trim(),
        item_name_en: form.item_name_en.trim() || undefined,
        category: form.category.trim() || undefined,
        price: Number(form.price)
      });
      setForm({ item_name: '', item_name_en: '', category: '', price: '' });
      toast.success(t('menuAdmin.added'));
      await load();
    } catch (e) {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return;
      }
      toast.error(e.status === 403 ? t('menuAdmin.adminOnly') : e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StaffLayout title={t('staff.title.menu')}>
      <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-4 dark:bg-stone-900">
          <h2 className="text-lg font-bold">{t('menuAdmin.add')}</h2>
          <label className={labelClass}>
            {t('menuAdmin.name')}
            <input value={form.item_name} onChange={update('item_name')} maxLength={100} required className={inputClass} />
          </label>
          <label className={labelClass}>
            {t('menuAdmin.nameEn')}
            <input value={form.item_name_en} onChange={update('item_name_en')} maxLength={100} lang="en" className={inputClass} />
          </label>
          <label className={labelClass}>
            {t('menuAdmin.category')}
            <input value={form.category} onChange={update('category')} maxLength={50} placeholder={t('menuAdmin.categoryPh')} className={inputClass} />
          </label>
          <label className={labelClass}>
            {t('menuAdmin.price')}
            <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required className={inputClass} />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('menuAdmin.saving') : t('menuAdmin.submit')}
          </Button>
        </form>

        <section className="rounded-2xl bg-white p-4 dark:bg-stone-900" aria-label={t('menuAdmin.listAria')}>
          <h2 className="mb-2 text-lg font-bold">{t('menuAdmin.all')}{menus ? ` (${menus.length})` : ''}</h2>
          {menus === null && !loadError && <Skeleton className="h-40" />}
          {loadError && (
            <EmptyState icon="⚠️" title={t('menu.loadFail')} hint={loadError}>
              <Button onClick={load}>{t('common.retry')}</Button>
            </EmptyState>
          )}
          {menus && (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {menus.map((m) => (
                <li key={m.menu_item_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{localizedName(m, lang)}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">{m.category || t('cat.other')}</p>
                  </div>
                  <strong>{formatBaht(m.price)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
