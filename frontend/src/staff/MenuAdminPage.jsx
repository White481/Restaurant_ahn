import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
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

// แปลงแถวจาก API เป็นค่าในฟอร์ม (ช่องว่าง = '')
const toForm = (m) => ({
  item_name: m.item_name || '',
  item_name_en: m.item_name_en || '',
  category: m.category || '',
  price: String(m.price ?? ''),
  image_url: m.image_url || ''
});

// แปลงค่าในฟอร์มเป็น body ของ API
const toBody = (form, isActive = true) => ({
  item_name: form.item_name.trim(),
  item_name_en: form.item_name_en.trim() || null,
  category: form.category.trim() || null,
  price: Number(form.price),
  image_url: form.image_url.trim() || null,
  is_active: isActive
});

// จัดการเมนู (เฉพาะ admin): CRUD ครบ
//   Create = ฟอร์มเพิ่มเมนู, Read = รายการทั้งหมด (รวมที่ซ่อน), Update = แก้ไข / ซ่อน / แสดง, Delete = ลบ (เคยถูกสั่งแล้ว -> ซ่อนแทน)
export default function MenuAdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t } = useLang();
  const [menus, setMenus] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // เมนูที่กำลังแก้ไข (null = โหมดเพิ่มใหม่)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setMenus(await api.getAllMenus());
      setLoadError('');
    } catch (e) {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return;
      }
      setLoadError(e.message);
    }
  }, [logout, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // error จาก API: token หมดอายุ -> กลับไป login, อย่างอื่น -> toast
  const handleError = (e) => {
    if (e.status === 401) {
      logout();
      navigate('/staff/login', { replace: true });
      return;
    }
    toast.error(e.status === 403 ? t('menuAdmin.adminOnly') : e.message);
  };

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const imageUrl = form.image_url.trim();
  const imageInvalid = imageUrl !== '' && !isHttpUrl(imageUrl);

  function startEdit(menu) {
    setEditing(menu);
    setForm(toForm(menu));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (imageInvalid) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.updateMenu(editing.menu_item_id, toBody(form, Boolean(editing.is_active)));
        toast.success(t('menuAdmin.updated'));
      } else {
        await api.createMenu(toBody(form));
        toast.success(t('menuAdmin.added'));
      }
      cancelEdit();
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(menu) {
    setBusyId(menu.menu_item_id);
    try {
      const nextActive = !menu.is_active;
      await api.updateMenu(menu.menu_item_id, toBody(toForm(menu), nextActive));
      toast.success(nextActive ? t('menuAdmin.shown') : t('menuAdmin.hiddenOk'));
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const menu = deleteTarget;
    setDeleteTarget(null);
    setBusyId(menu.menu_item_id);
    try {
      const result = await api.deleteMenu(menu.menu_item_id);
      toast.success(result.result === 'deleted' ? t('menuAdmin.deleted') : t('menuAdmin.hiddenInstead'));
      if (editing?.menu_item_id === menu.menu_item_id) cancelEdit();
      await load();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  const previewName = form.item_name.trim() || t('menuAdmin.name');
  const activeCount = menus ? menus.filter((m) => m.is_active).length : 0;

  return (
    <StaffLayout title={t('staff.title.menu')}>
      <div className="grid items-start gap-6 lg:grid-cols-[24rem_1fr]">
        <form
          onSubmit={handleSubmit}
          className={`flex flex-col gap-4 rounded-xl border bg-stone-50 p-5 lg:sticky lg:top-4 dark:bg-stone-900 ${
            editing ? 'border-brand-500 ring-3 ring-brand-500/15' : 'border-stone-300 dark:border-stone-800'
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold">{editing ? t('menuAdmin.editTitle') : t('menuAdmin.add')}</h2>
            {editing && <span className="eyebrow">#{editing.menu_item_id}</span>}
          </div>
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

          <div className="flex gap-2">
            {editing && (
              <Button variant="secondary" onClick={cancelEdit}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={submitting || imageInvalid}>
              {submitting ? t('menuAdmin.saving') : editing ? t('menuAdmin.save') : t('menuAdmin.submit')}
            </Button>
          </div>
        </form>

        <section
          className="rounded-xl border border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
          aria-label={t('menuAdmin.listAria')}
        >
          <h2 className="flex items-baseline justify-between border-b border-stone-300 px-5 py-4 font-display text-xl font-bold dark:border-stone-800">
            {t('menuAdmin.all')}
            {menus && (
              <span className="eyebrow">
                {t('menuAdmin.count', { active: activeCount, total: menus.length })}
              </span>
            )}
          </h2>
          {menus === null && !loadError && <Skeleton className="m-5 h-40" />}
          {loadError && (
            <EmptyState icon="alert" title={t('menu.loadFail')} hint={loadError}>
              <Button onClick={load}>{t('common.retry')}</Button>
            </EmptyState>
          )}
          {menus && (
            <ul>
              {menus.map((m) => {
                const name = localizedName(m, lang);
                const busy = busyId === m.menu_item_id;
                return (
                  <li
                    key={m.menu_item_id}
                    className={`flex flex-wrap items-center gap-3 border-b border-stone-200 px-5 py-3 last:border-b-0 even:bg-stone-100 dark:border-stone-800 dark:even:bg-stone-900/60 ${
                      m.is_active ? '' : 'opacity-60'
                    } ${editing?.menu_item_id === m.menu_item_id ? 'bg-brand-50! dark:bg-brand-950!' : ''}`}
                  >
                    <MenuThumb src={m.image_url} name={name} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-semibold">
                        {name}
                        {!m.is_active && (
                          <span className="rounded bg-stone-300 px-1.5 text-[11px] font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                            {t('menuAdmin.hidden')}
                          </span>
                        )}
                      </p>
                      <p className="eyebrow">{m.category || t('cat.other')}</p>
                    </div>
                    <strong className="font-display text-lg tabular-nums">{formatBaht(m.price)}</strong>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => startEdit(m)}>
                        {t('menuAdmin.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleActive(m)}>
                        {m.is_active ? t('menuAdmin.hide') : t('menuAdmin.show')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => setDeleteTarget(m)}
                        aria-label={t('menuAdmin.deleteAria', { name })}
                      >
                        <Icon name="x" className="size-3.5" />
                        {t('menuAdmin.delete')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? t('menuAdmin.deleteTitle', { name: localizedName(deleteTarget, lang) }) : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} autoFocus>
              {t('common.cancel')}
            </Button>
            <Button variant="dangerSolid" onClick={confirmDelete}>
              {t('menuAdmin.delete')}
            </Button>
          </>
        }
      >
        <p>{t('menuAdmin.deleteBody')}</p>
      </Modal>
    </StaffLayout>
  );
}
