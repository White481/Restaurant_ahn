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
import MenuThumb from '../customer/components/MenuThumb.jsx';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';

const EMPTY_FORM = { item_name: '', item_name_en: '', category: '', price: '', image_url: '' };
const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(value);

// จัดการเมนู (เฉพาะ admin): ดูรายการ + เพิ่มเมนูใหม่ (พร้อมพรีวิวหน้าตาบนหน้าเมนูลูกค้า)
export default function MenuAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t } = useLang();
  const [menus, setMenus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
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
  const imageUrl = form.image_url.trim();
  const imageInvalid = imageUrl !== '' && !isHttpUrl(imageUrl);

  async function handleSubmit(event) {
    event.preventDefault();
    if (imageInvalid) return;
    setSubmitting(true);
    try {
      await api.createMenu({
        item_name: form.item_name.trim(),
        item_name_en: form.item_name_en.trim() || undefined,
        category: form.category.trim() || undefined,
        price: Number(form.price),
        image_url: imageUrl || undefined
      });
      setForm(EMPTY_FORM);
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

  const previewName = form.item_name.trim() || t('menuAdmin.name');

  return (
    <StaffLayout title={t('staff.title.menu')}>
      <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-stone-300 bg-stone-50 p-5 lg:sticky lg:top-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <h2 className="font-display text-xl font-bold">{t('menuAdmin.add')}</h2>
          <label className={labelClass}>
            {t('menuAdmin.name')}
            <input value={form.item_name} onChange={update('item_name')} maxLength={100} required className={inputClass} />
          </label>
          <label className={labelClass}>
            {t('menuAdmin.nameEn')}
            <input value={form.item_name_en} onChange={update('item_name_en')} maxLength={100} lang="en" className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              {t('menuAdmin.category')}
              <input value={form.category} onChange={update('category')} maxLength={50} placeholder={t('menuAdmin.categoryPh')} className={inputClass} />
            </label>
            <label className={labelClass}>
              {t('menuAdmin.price')}
              <input type="number" min="0" step="0.01" value={form.price} onChange={update('price')} required className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            {t('menuAdmin.image')}
            <input
              type="url"
              value={form.image_url}
              onChange={update('image_url')}
              maxLength={500}
              placeholder="https://"
              aria-invalid={imageInvalid}
              className={`${inputClass} ${imageInvalid ? 'border-chili-500!' : ''}`}
            />
            <span className={`text-xs font-normal normal-case tracking-normal ${imageInvalid ? 'text-chili-700 dark:text-chili-300' : 'text-stone-500 dark:text-stone-400'}`}>
              {imageInvalid ? t('menuAdmin.imageBad') : t('menuAdmin.imageHint')}
            </span>
          </label>

          {/* พรีวิว: หน้าตาเดียวกับบรรทัดในหน้าเมนูของลูกค้า */}
          <div className="rounded-lg border border-dashed border-stone-400 bg-paper px-3 py-3 dark:border-stone-700 dark:bg-stone-950">
            <p className="eyebrow mb-2">{t('menuAdmin.preview')}</p>
            <div className="flex gap-3">
              <MenuThumb key={imageUrl} src={imageInvalid ? '' : imageUrl} name={previewName} className="size-16" />
              <div className="flex min-w-0 flex-1 items-baseline gap-2 self-start">
                <span className="truncate font-semibold">{previewName}</span>
                <span className="leader" aria-hidden="true" />
                <span className="font-display text-lg font-bold text-brand-600">{form.price ? formatBaht(form.price) : '฿—'}</span>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={submitting || imageInvalid}>
            {submitting ? t('menuAdmin.saving') : t('menuAdmin.submit')}
          </Button>
        </form>

        <section
          className="rounded-xl border border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
          aria-label={t('menuAdmin.listAria')}
        >
          <h2 className="flex items-baseline justify-between border-b border-stone-300 px-5 py-4 font-display text-xl font-bold dark:border-stone-800">
            {t('menuAdmin.all')}
            {menus && <span className="eyebrow">{menus.length}</span>}
          </h2>
          {menus === null && !loadError && <Skeleton className="m-5 h-40" />}
          {loadError && (
            <EmptyState icon="alert" title={t('menu.loadFail')} hint={loadError}>
              <Button onClick={load}>{t('common.retry')}</Button>
            </EmptyState>
          )}
          {menus && (
            <ul>
              {menus.map((m) => (
                <li
                  key={m.menu_item_id}
                  className="flex items-center gap-3 border-b border-stone-200 px-5 py-3 last:border-b-0 even:bg-stone-100 dark:border-stone-800 dark:even:bg-stone-900/60"
                >
                  <MenuThumb src={m.image_url} name={localizedName(m, lang)} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{localizedName(m, lang)}</p>
                    <p className="eyebrow">{m.category || t('cat.other')}</p>
                  </div>
                  <strong className="font-display text-lg tabular-nums">{formatBaht(m.price)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
