import { useEffect, useState } from 'react';
import {
  Activity, HardDrive, Sliders, Image as ImageIcon, Folder as FolderIcon,
  GitBranch, Terminal, CheckCircle, Languages,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { LangSwitcher } from '../components/LangSwitcher';
import { Toggle, GROUP_LABEL, LABEL_CSS } from '../components/primitives';

type Section = 'tracker' | 'client' | 'prefs' | 'imghost' | 'paths' | 'seeding' | 'console' | 'interface';

const SECTIONS: { id: Section; labelKey: string; icon: any }[] = [
  { id: 'tracker',  labelKey: 'settings.navTracker',  icon: Activity },
  { id: 'client',   labelKey: 'settings.navClient',   icon: HardDrive },
  { id: 'prefs',    labelKey: 'settings.navPrefs',    icon: Sliders },
  { id: 'imghost',  labelKey: 'settings.navImghost',  icon: ImageIcon },
  { id: 'paths',    labelKey: 'settings.navPaths',    icon: FolderIcon },
  { id: 'seeding',  labelKey: 'settings.navSeeding',  icon: GitBranch },
  { id: 'interface',labelKey: 'settings.navInterface',icon: Languages },
  { id: 'console',  labelKey: 'settings.navConsole',  icon: Terminal },
];

const IMAGE_HOSTS = [
  { key: 'PTSCREENS', label: 'PtScreens',  url: 'ptscreens.com' },
  { key: 'PASSIMA',   label: 'PassIMA',    url: 'passtheima.ge' },
  { key: 'IMGBB',     label: 'ImgBB',      url: 'imgbb.com' },
  { key: 'IMGFI',     label: 'ImgFI',      url: 'imgfi.com' },
  { key: 'FREE_IMAGE',label: 'FreeImage',  url: 'freeimage.host' },
  { key: 'LENSDUMP',  label: 'LensDump',   url: 'lensdump.com' },
  { key: 'IMARIDE',   label: 'ImaRide',    url: 'imageride.net' },
];

type SettingsResponse = {
  config: Record<string, any>;
  env: Record<string, string>;
  config_path: string;
};

export function SettingsView({ isMobile }: { isMobile?: boolean } = {}) {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>('tracker');
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<SettingsResponse>('/api/settings').then(setData).catch(() => {});
  }, []);

  if (!data) {
    return <div style={{ padding: 24, color: 'var(--fg-3)' }}>{t('settings.loading')}</div>;
  }

  const cfg = data.config;
  const set = (key: string, value: any) =>
    setData((d) => d && ({ ...d, config: { ...d.config, [key]: value } }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put<{ config: Record<string, any> }>('/api/settings', cfg);
      setData((d) => d && ({ ...d, config: r.config }));
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const navStyle = isMobile
    ? {
        display: 'flex', gap: 4, padding: '8px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto' as const, overflowY: 'hidden' as const,
        flexShrink: 0, WebkitOverflowScrolling: 'touch' as const,
      }
    : {
        width: 160, borderRight: '1px solid var(--border-subtle)',
        padding: '10px 6px', flexShrink: 0,
      };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', flex: 1, overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        <div style={navStyle}>
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 6,
                  marginBottom: isMobile ? 0 : 2,
                  flexShrink: 0, whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: active ? 'var(--blue-muted)' : 'transparent',
                  color: active ? 'var(--blue-bright)' : 'var(--fg-3)',
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  fontFamily: 'var(--font-display)',
                  border: active
                    ? '1px solid rgba(59,130,246,0.2)'
                    : '1px solid transparent',
                }}
              >
                <Icon size={13} />{t(s.labelKey)}
              </div>
            );
          })}
        </div>

        <div style={{
          flex: 1, minWidth: 0,
          padding: isMobile ? '14px' : '18px 20px',
          overflowY: 'auto',
        }}>
          {section === 'tracker' && <TrackerSection cfg={cfg} set={set} isMobile={isMobile} />}
          {section === 'client' && <ClientSection cfg={cfg} set={set} isMobile={isMobile} />}
          {section === 'prefs' && <PrefsSection cfg={cfg} set={set} />}
          {section === 'imghost' && <ImageHostsSection cfg={cfg} set={set} />}
          {section === 'paths' && <PathsSection cfg={cfg} set={set} isMobile={isMobile} />}
          {section === 'seeding' && <SeedingSection cfg={cfg} set={set} env={data.env} isMobile={isMobile} />}
          {section === 'interface' && <InterfaceSection />}
          {section === 'console' && <ConsoleSection cfg={cfg} set={set} />}
        </div>
      </div>

      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
      }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: 'var(--blue)', border: 'none', borderRadius: 6,
            padding: '7px 18px', fontSize: 12, fontWeight: 600,
            color: '#fff', cursor: saving ? 'default' : 'pointer',
            fontFamily: 'var(--font-display)',
          }}
        >{saving ? t('settings.saving') : t('settings.saveBtn')}</button>
        {saved && (
          <span style={{
            fontSize: 12, color: 'var(--green)',
            fontFamily: 'var(--font-display)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <CheckCircle size={13} /> {t('settings.savedSuccess')}
          </span>
        )}
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: 'var(--fg-4)',
          fontFamily: 'var(--font-mono)',
        }}>{data.config_path}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- Helpers

function InterfaceSection() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={GROUP_LABEL}>{t('settings.interface')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={LABEL_CSS}>{t('common.language')}</label>
        <LangSwitcher compact={false} />
        <div style={{
          fontSize: 11, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)',
          marginTop: 4,
        }}>{t('settings.languageDesc')}</div>
      </div>
    </div>
  );
}

type SetFn = (k: string, v: any) => void;
type Cfg = Record<string, any>;

function Field({
  cfg, set, k, label, type = 'text', masked = false, wide = false,
}: {
  cfg: Cfg; set: SetFn; k: string; label: string;
  type?: string; masked?: boolean; wide?: boolean;
}) {
  const val = cfg[k];
  const display = masked && val === '__SET__' ? '' : (val ?? '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={LABEL_CSS}>{label}</label>
      <input
        type={masked ? 'password' : type}
        value={display}
        placeholder={masked && val === '__SET__' ? '••••••• (set)' : ''}
        onChange={(e) => set(k, type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '7px 10px', fontSize: 12,
          color: 'var(--fg-1)', fontFamily: 'var(--font-mono)',
          width: wide ? '100%' : undefined,
        }}
      />
    </div>
  );
}

function ToggleRow({
  cfg, set, k, label, sub,
}: {
  cfg: Cfg; set: SetFn; k: string; label: string; sub: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <div style={{
          fontSize: 13, color: 'var(--fg-2)',
          fontFamily: 'var(--font-display)',
        }}>{label}</div>
        <div style={{
          fontSize: 11, color: 'var(--fg-4)',
          fontFamily: 'var(--font-display)',
        }}>{sub}</div>
      </div>
      <Toggle on={!!cfg[k]} onToggle={() => set(k, !cfg[k])} />
    </div>
  );
}

// -------------------------------------------------------------- Sections ----

function TrackerSection({ cfg, set, isMobile }: { cfg: Cfg; set: SetFn; isMobile?: boolean }) {
  const { t } = useTranslation();
  const grid2: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10,
  };
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>ITT — ITA Torrents</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="ITT_URL" label="ITT_URL" />
        <Field cfg={cfg} set={set} k="ITT_APIKEY" label="ITT_APIKEY" masked />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="ITT_PID" label="ITT_PID" masked />
      </div>

      <div style={GROUP_LABEL}>PTT — Polish Torrent</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="PTT_URL" label="PTT_URL" />
        <Field cfg={cfg} set={set} k="PTT_APIKEY" label="PTT_APIKEY" masked />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="PTT_PID" label="PTT_PID" masked />
      </div>

      <div style={GROUP_LABEL}>SIS</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="SIS_URL" label="SIS_URL" />
        <Field cfg={cfg} set={set} k="SIS_APIKEY" label="SIS_APIKEY" masked />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="SIS_PID" label="SIS_PID" masked />
      </div>

      <div style={GROUP_LABEL}>{t('settings.trackerActiveGroup')}</div>
      <MultiTrackerRow cfg={cfg} set={set} />

      <div style={GROUP_LABEL}>{t('settings.trackerExternalGroup')}</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="TMDB_APIKEY" label="TMDB_APIKEY" masked />
        <Field cfg={cfg} set={set} k="TVDB_APIKEY" label="TVDB_APIKEY" masked />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="YOUTUBE_KEY" label="YOUTUBE_KEY" masked />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="IGDB_CLIENT_ID" label="IGDB_CLIENT_ID" masked />
        <Field cfg={cfg} set={set} k="IGDB_ID_SECRET" label="IGDB_ID_SECRET" masked />
      </div>
    </>
  );
}

function MultiTrackerRow({ cfg, set }: { cfg: Cfg; set: SetFn }) {
  const TRACKERS = [
    { id: 'itt', label: 'ITT' },
    { id: 'ptt', label: 'PTT' },
    { id: 'sis', label: 'SIS' },
  ];
  const active: string[] = Array.isArray(cfg.MULTI_TRACKER)
    ? cfg.MULTI_TRACKER : ['itt'];
  const toggle = (id: string) => {
    const next = active.includes(id)
      ? active.filter((x) => x !== id)
      : [...active, id];
    set('MULTI_TRACKER', next.length ? next : ['itt']);
  };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {TRACKERS.map((tracker) => {
        const on = active.includes(tracker.id);
        return (
          <button
            key={tracker.id}
            onClick={() => toggle(tracker.id)}
            style={{
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-display)',
              background: on ? 'var(--blue)' : 'var(--bg-card)',
              color: on ? '#fff' : 'var(--fg-2)',
              border: `1px solid ${on ? 'var(--blue)' : 'var(--border)'}`,
            }}
          >{on ? '✓ ' : ''}{tracker.label}</button>
        );
      })}
    </div>
  );
}

function ClientSection({ cfg, set, isMobile }: { cfg: Cfg; set: SetFn; isMobile?: boolean }) {
  const { t } = useTranslation();
  const grid2: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10,
  };
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.clientActiveGroup')}</div>
      <div style={grid2}>
        <div>
          <label style={LABEL_CSS}>TORRENT_CLIENT</label>
          <select
            value={cfg.TORRENT_CLIENT ?? 'qbittorrent'}
            onChange={(e) => set('TORRENT_CLIENT', e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 10px', fontSize: 12,
              color: 'var(--fg-1)', fontFamily: 'var(--font-display)',
              width: '100%',
            }}
          >
            <option value="qbittorrent">qbittorrent</option>
            <option value="transmission">transmission</option>
            <option value="rtorrent">rtorrent</option>
          </select>
        </div>
        <Field cfg={cfg} set={set} k="TAG" label="TAG" />
      </div>

      <div style={GROUP_LABEL}>qBittorrent</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="QBIT_HOST" label="QBIT_HOST" />
        <Field cfg={cfg} set={set} k="QBIT_PORT" label="QBIT_PORT" />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="QBIT_USER" label="QBIT_USER" />
        <Field cfg={cfg} set={set} k="QBIT_PASS" label="QBIT_PASS" masked />
      </div>
      <div style={{ ...grid2, gridTemplateColumns: '1fr' }}>
        <Field cfg={cfg} set={set} k="SHARED_QBIT_PATH" label="SHARED_QBIT_PATH" wide />
      </div>

      <div style={GROUP_LABEL}>Transmission</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="TRASM_HOST" label="TRASM_HOST" />
        <Field cfg={cfg} set={set} k="TRASM_PORT" label="TRASM_PORT" />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="TRASM_USER" label="TRASM_USER" />
        <Field cfg={cfg} set={set} k="TRASM_PASS" label="TRASM_PASS" masked />
      </div>
      <div style={{ ...grid2, gridTemplateColumns: '1fr' }}>
        <Field cfg={cfg} set={set} k="SHARED_TRASM_PATH" label="SHARED_TRASM_PATH" wide />
      </div>

      <div style={GROUP_LABEL}>rTorrent</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="RTORR_HOST" label="RTORR_HOST" />
        <Field cfg={cfg} set={set} k="RTORR_PORT" label="RTORR_PORT" />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="RTORR_USER" label="RTORR_USER" />
        <Field cfg={cfg} set={set} k="RTORR_PASS" label="RTORR_PASS" masked />
      </div>
      <div style={{ ...grid2, gridTemplateColumns: '1fr' }}>
        <Field cfg={cfg} set={set} k="SHARED_RTORR_PATH" label="SHARED_RTORR_PATH" wide />
      </div>
    </>
  );
}

function PrefsSection({ cfg, set }: { cfg: Cfg; set: SetFn }) {
  const { t } = useTranslation();
  const upload: [string, string, string][] = [
    ['DUPLICATE_ON',    t('settings.prefsDuplicateCheck'),  t('settings.prefsDuplicateCheckSub')],
    ['SKIP_DUPLICATE',  t('settings.prefsSkipDuplicates'),  t('settings.prefsSkipDuplicatesSub')],
    ['SKIP_TMDB',       t('settings.prefsSkipTmdb'),        t('settings.prefsSkipTmdbSub')],
    ['SKIP_YOUTUBE',    t('settings.prefsSkipYoutube'),     t('settings.prefsSkipYoutubeSub')],
    ['ANON',            t('settings.prefsAnon'),            t('settings.prefsAnonSub')],
    ['PERSONAL_RELEASE',t('settings.prefsPersonal'),        t('settings.prefsPersonalSub')],
  ];
  const scr: [string, string, string][] = [
    ['WEBP_ENABLED',  t('settings.prefsWebp'),      t('settings.prefsWebpSub')],
    ['CACHE_SCR',     t('settings.prefsCacheScr'),  t('settings.prefsCacheScrSub')],
    ['RESIZE_SCSHOT', t('settings.prefsResizeScr'), t('settings.prefsResizeScrSub')],
  ];
  const grid2: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10,
  };
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.prefsBehaviourGroup')}</div>
      {upload.map(([k, l, s]) =>
        <ToggleRow key={k} cfg={cfg} set={set} k={k} label={l} sub={s} />)}

      <div style={GROUP_LABEL}>{t('settings.prefsScreenshotsGroup')}</div>
      {scr.map(([k, l, s]) =>
        <ToggleRow key={k} cfg={cfg} set={set} k={k} label={l} sub={s} />)}
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="NUMBER_OF_SCREENSHOTS" label="NUMBER_OF_SCREENSHOTS" type="number" />
        <Field cfg={cfg} set={set} k="COMPRESS_SCSHOT" label="COMPRESS_SCSHOT (1–5)" type="number" />
      </div>

      <div style={GROUP_LABEL}>{t('settings.prefsCacheDbGroup')}</div>
      <ToggleRow cfg={cfg} set={set} k="CACHE_DBONLINE"
                 label={t('settings.prefsCacheDb')}
                 sub={t('settings.prefsCacheDbSub')} />
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="SIZE_TH" label="SIZE_TH (GB threshold)" type="number" />
        <Field cfg={cfg} set={set} k="FAST_LOAD" label="FAST_LOAD" type="number" />
      </div>

      <div style={GROUP_LABEL}>{t('settings.prefsYoutubeGroup')}</div>
      <ToggleRow cfg={cfg} set={set} k="YOUTUBE_CHANNEL_ENABLE"
                 label={t('settings.prefsYoutubeChannel')}
                 sub={t('settings.prefsYoutubeChannelSub')} />
      <div style={{ ...grid2, gridTemplateColumns: '1fr' }}>
        <Field cfg={cfg} set={set} k="YOUTUBE_FAV_CHANNEL_ID" label="YOUTUBE_FAV_CHANNEL_ID" wide />
      </div>

      <div style={GROUP_LABEL}>{t('settings.prefsWatcherGroup')}</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="WATCHER_INTERVAL" label="WATCHER_INTERVAL (sec)" type="number" />
      </div>

      <div style={GROUP_LABEL}>{t('settings.prefsReleaseGroup')}</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="TORRENT_COMMENT" label="TORRENT_COMMENT" />
        <Field cfg={cfg} set={set} k="PREFERRED_LANG" label="PREFERRED_LANG" />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="RELEASER_SIGN" label="RELEASER_SIGN (max 20 chars)" />
      </div>

      <div style={GROUP_LABEL}>{t('settings.prefsTagOrderGroup')}</div>
      <p style={{
        fontSize: 11, color: 'var(--fg-4)',
        fontFamily: 'var(--font-display)', marginBottom: 8,
      }}>{t('settings.prefsTagOrderDesc')}</p>
      <TagOrderChips title="TAG_ORDER_MOVIE" tags={cfg.TAG_ORDER_MOVIE ?? []} emptyLabel={t('settings.prefsTagEmpty')} />
      <TagOrderChips title="TAG_ORDER_SERIE" tags={cfg.TAG_ORDER_SERIE ?? []} emptyLabel={t('settings.prefsTagEmpty')} />
    </>
  );
}

function TagOrderChips({ title, tags, emptyLabel }: { title: string; tags: string[]; emptyLabel: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ ...LABEL_CSS, marginBottom: 6, display: 'block' }}>{title}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tags.length === 0 && (
          <span style={{
            fontSize: 11, color: 'var(--fg-4)',
            fontFamily: 'var(--font-display)',
          }}>{emptyLabel}</span>
        )}
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 4,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)',
          }}>
            <span style={{ color: 'var(--fg-4)' }}>{i + 1}</span>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ImageHostsSection({ cfg, set }: { cfg: Cfg; set: SetFn }) {
  const { t } = useTranslation();
  const order: string[] = cfg.IMAGE_HOST_ORDER ?? IMAGE_HOSTS.map((h) => h.key);
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    set('IMAGE_HOST_ORDER', next);
  };
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.imgPriorityGroup')}</div>
      <p style={{
        fontSize: 12, color: 'var(--fg-3)',
        fontFamily: 'var(--font-display)', marginBottom: 12, lineHeight: 1.6,
      }}>
        {t('settings.imgDesc')}
      </p>
      {order.map((key, idx) => {
        const host = IMAGE_HOSTS.find((h) => h.key === key);
        if (!host) return null;
        return (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 6, marginBottom: 6,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--blue)',
              fontFamily: 'var(--font-mono)',
            }}>{idx + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                color: 'var(--fg-1)',
              }}>{host.label}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)',
              }}>{host.url}</div>
            </div>
            <input
              type="password"
              value={cfg[`${key}_KEY`] === '__SET__' ? '' : (cfg[`${key}_KEY`] ?? '')}
              placeholder={cfg[`${key}_KEY`] === '__SET__' ? '••••••• (set)' : `${key}_KEY`}
              onChange={(e) => set(`${key}_KEY`, e.target.value)}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '5px 8px', fontSize: 11,
                color: 'var(--fg-2)', width: 140,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => move(idx, -1)} style={arrowBtn}>▲</button>
              <button onClick={() => move(idx, +1)} style={arrowBtn}>▼</button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function PathsSection({ cfg, set, isMobile }: { cfg: Cfg; set: SetFn; isMobile?: boolean }) {
  const { t } = useTranslation();
  const grid2: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 10,
  };
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.pathsStorageGroup')}</div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
        <Field cfg={cfg} set={set} k="TORRENT_ARCHIVE_PATH" label="TORRENT_ARCHIVE_PATH" wide />
        <Field cfg={cfg} set={set} k="CACHE_PATH" label="CACHE_PATH" wide />
        <Field cfg={cfg} set={set} k="WATCHER_PATH" label="WATCHER_PATH" wide />
        <Field cfg={cfg} set={set} k="WATCHER_DESTINATION_PATH" label="WATCHER_DESTINATION_PATH" wide />
      </div>

      <div style={GROUP_LABEL}>{t('settings.pathsFtpGroup')}</div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="FTPX_IP" label="FTPX_IP" />
        <Field cfg={cfg} set={set} k="FTPX_PORT" label="FTPX_PORT" />
      </div>
      <div style={grid2}>
        <Field cfg={cfg} set={set} k="FTPX_USER" label="FTPX_USER" />
        <Field cfg={cfg} set={set} k="FTPX_PASS" label="FTPX_PASS" masked />
      </div>
      <div style={{ display: 'grid', gap: 10, marginBottom: 10 }}>
        <Field cfg={cfg} set={set} k="FTPX_LOCAL_PATH" label="FTPX_LOCAL_PATH" wide />
        <Field cfg={cfg} set={set} k="FTPX_ROOT" label="FTPX_ROOT" wide />
      </div>
      <ToggleRow cfg={cfg} set={set} k="FTPX_KEEP_ALIVE"
        label={t('settings.pathsFtpKeepAlive')}
        sub={t('settings.pathsFtpKeepAliveSub')} />
    </>
  );
}

type FsCheck = {
  media_root: string;
  seedings_dir: string;
  media_exists: boolean;
  seedings_exists: boolean;
  same_fs: boolean;
};

type Categories = {
  root: string;
  root_exists: boolean;
  categories: { id: string; label: string; count: number }[];
};

function SeedingSection({
  cfg, set, env, isMobile,
}: { cfg: Cfg; set: SetFn; env: Record<string, string>; isMobile?: boolean }) {
  const { t } = useTranslation();
  const twoCols = isMobile ? '1fr' : '1fr 1fr';
  const [fsCheck, setFsCheck] = useState<FsCheck | null>(null);
  const [cats, setCats] = useState<Categories | null>(null);

  useEffect(() => {
    api.get<FsCheck>('/api/settings/fs-check').then(setFsCheck).catch(() => {});
    api.get<Categories>('/api/library/categories').then(setCats).catch(() => {});
  }, [cfg.U3DP_MEDIA_ROOT, cfg.U3DP_SEEDINGS_DIR]);

  const restartNote = (
    <span style={{
      fontSize: 10, color: 'var(--yellow)',
      fontFamily: 'var(--font-display)', marginLeft: 6,
    }}>{t('settings.seedingRequiresRestart')}</span>
  );

  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.seedingMediaRootGroup')}</div>
      <p style={{
        fontSize: 12, color: 'var(--fg-3)',
        fontFamily: 'var(--font-display)', marginBottom: 10, lineHeight: 1.6,
      }}>
        {t('settings.seedingMediaRootDesc')}
      </p>
      <Field cfg={cfg} set={set} k="U3DP_MEDIA_ROOT" label="U3DP_MEDIA_ROOT" wide />
      {cats && (
        <div style={{
          marginTop: 8, padding: '8px 10px', background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 6,
          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)',
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        }}>
          <span style={{ color: 'var(--fg-4)' }}>{t('settings.seedingDiscovered')}</span>
          {cats.categories.length === 0 && <span>{t('settings.seedingNoSubfolders')}</span>}
          {cats.categories.map((c) => (
            <span key={c.id} style={{
              padding: '2px 6px', background: 'var(--bg-base)',
              border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--fg-2)',
            }}>{c.label} <span style={{ color: 'var(--fg-4)' }}>({c.count})</span></span>
          ))}
        </div>
      )}

      <div style={GROUP_LABEL}>{t('settings.seedingHardlinkTargetGroup')}</div>
      <Field cfg={cfg} set={set} k="U3DP_SEEDINGS_DIR" label="U3DP_SEEDINGS_DIR" wide />
      {fsCheck && (
        <div style={{
          marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontFamily: 'var(--font-display)',
          color: fsCheck.same_fs ? 'var(--green)' : 'var(--yellow)',
        }}>
          <span style={{
            padding: '2px 8px', borderRadius: 9999, fontWeight: 700,
            background: fsCheck.same_fs ? 'var(--green-dim)' : 'rgba(245,166,35,0.1)',
            border: `1px solid ${fsCheck.same_fs ? 'var(--green)' : 'var(--yellow)'}`,
          }}>
            {fsCheck.same_fs ? t('settings.seedingSameFs') : t('settings.seedingDifferentFs')}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)',
          }}>
            {t('settings.seedingFsNote')}
          </span>
        </div>
      )}

      <div style={GROUP_LABEL}>{t('settings.seedingDbGroup')}</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Field cfg={cfg} set={set} k="U3DP_DB_PATH" label="U3DP_DB_PATH" wide />
        <Field cfg={cfg} set={set} k="U3DP_TMDB_CACHE_PATH" label="U3DP_TMDB_CACHE_PATH" wide />
        <Field cfg={cfg} set={set} k="U3DP_LANG_CACHE_PATH" label="U3DP_LANG_CACHE_PATH" wide />
      </div>

      <div style={GROUP_LABEL}>{t('settings.seedingWebUiGroup')}</div>
      <p style={{
        fontSize: 11, color: 'var(--fg-4)',
        fontFamily: 'var(--font-display)', marginBottom: 8,
      }}>
        {t('settings.seedingWebUiDesc')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 10 }}>
        <Field cfg={cfg} set={set} k="U3DP_HOST" label="U3DP_HOST" />
        <Field cfg={cfg} set={set} k="U3DP_PORT" label="U3DP_PORT" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: twoCols, gap: 10, marginTop: 10 }}>
        <Field cfg={cfg} set={set} k="U3DP_ROOT_PATH" label="U3DP_ROOT_PATH (nginx prefix)" />
        <Field cfg={cfg} set={set} k="U3DP_TMDB_LANG" label="U3DP_TMDB_LANG" />
      </div>
      <div style={{ marginTop: 10 }}>
        <ToggleRow
          cfg={cfg} set={set} k="U3DP_HTTPS_ONLY"
          label={t('settings.seedingHttpsOnly')}
          sub={t('settings.seedingHttpsOnlySub')}
        />
      </div>

      <div style={GROUP_LABEL}>{t('settings.seedingAutoUpdateGroup')}</div>
      <p style={{
        fontSize: 11, color: 'var(--fg-4)',
        fontFamily: 'var(--font-display)', marginBottom: 8,
      }}>
        {t('settings.seedingAutoUpdateDesc1')}{' '}
        <code>systemctl --user restart</code>{' '}
        {t('settings.seedingAutoUpdateDesc2')}{' '}
        <code>unit3dprep-web.service</code>.
      </p>
      <Field cfg={cfg} set={set} k="U3DP_SYSTEMD_UNIT" label="U3DP_SYSTEMD_UNIT" wide />

      <div style={GROUP_LABEL}>{t('settings.seedingEffectiveGroup')}</div>
      <p style={{
        fontSize: 11, color: 'var(--fg-4)',
        fontFamily: 'var(--font-display)', marginBottom: 8,
      }}>
        {t('settings.seedingEffectiveDesc')}{restartNote}
      </p>
      <div style={{ display: 'grid', gap: 4 }}>
        {Object.entries(env).map(([k, v]) => (
          <div key={k} style={{
            display: 'grid', gridTemplateColumns: '220px 1fr', alignItems: 'center',
            gap: 10, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)',
          }}>
            <label style={{ ...LABEL_CSS, marginBottom: 0 }}>{k}</label>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)',
              wordBreak: 'break-all',
            }}>{v || '—'}</span>
          </div>
        ))}
      </div>

      <div style={GROUP_LABEL}>{t('settings.seedingWizardDefaultsGroup')}</div>
      <ToggleRow cfg={cfg} set={set} k="W_AUDIO_CHECK"
        label={t('settings.seedingWizardAudioCheck')}
        sub={t('settings.seedingWizardAudioCheckSub')} />
      <ToggleRow cfg={cfg} set={set} k="W_AUTO_TMDB"
        label={t('settings.seedingWizardAutoTmdb')}
        sub={t('settings.seedingWizardAutoTmdbSub')} />
      <ToggleRow cfg={cfg} set={set} k="W_HIDE_UPLOADED"
        label={t('settings.seedingWizardHideUploaded')}
        sub={t('settings.seedingWizardHideUploadedSub')} />
      <ToggleRow cfg={cfg} set={set} k="W_HIDE_NO_ITALIAN"
        label={t('settings.seedingWizardHideNoItalian')}
        sub={t('settings.seedingWizardHideNoItalianSub')} />
      <ToggleRow cfg={cfg} set={set} k="W_HARDLINK_ONLY"
        label={t('settings.seedingWizardHardlinkOnly')}
        sub={t('settings.seedingWizardHardlinkOnlySub')} />
      <ToggleRow cfg={cfg} set={set} k="W_CONFIRM_NAMES"
        label={t('settings.seedingWizardConfirmNames')}
        sub={t('settings.seedingWizardConfirmNamesSub')} />
    </>
  );
}

function ConsoleSection({ cfg, set }: { cfg: Cfg; set: SetFn }) {
  const { t } = useTranslation();
  const keys = [
    'NORMAL_COLOR', 'ERROR_COLOR', 'QUESTION_MESSAGE_COLOR',
    'WELCOME_MESSAGE_COLOR', 'WELCOME_MESSAGE_BORDER_COLOR',
    'PANEL_MESSAGE_COLOR', 'PANEL_MESSAGE_BORDER_COLOR',
  ];
  return (
    <>
      <div style={{ ...GROUP_LABEL, marginTop: 0 }}>{t('settings.consoleColorsGroup')}</div>
      {keys.map((k) => (
        <div key={k} style={{
          display: 'grid', gridTemplateColumns: '220px 1fr',
          gap: 10, marginBottom: 8, alignItems: 'center',
        }}>
          <label style={{ ...LABEL_CSS, marginBottom: 0 }}>{k}</label>
          <input
            value={cfg[k] ?? ''}
            onChange={(e) => set(k, e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 10px', fontSize: 12,
              color: 'var(--fg-1)', fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
      ))}
      <div style={{ ...GROUP_LABEL, marginTop: 16 }}>{t('settings.consoleWelcomeGroup')}</div>
      <Field cfg={cfg} set={set} k="WELCOME_MESSAGE" label="WELCOME_MESSAGE" wide />
    </>
  );
}

const arrowBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)',
  borderRadius: 4, width: 22, height: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--fg-3)', padding: 0, fontSize: 9,
};
