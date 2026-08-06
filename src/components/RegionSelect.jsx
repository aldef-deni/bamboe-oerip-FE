import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_WILAYAH_API || 'https://www.emsifa.com/api-wilayah-indonesia/api'

const getJson = (url) =>
  fetch(url)
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])

const selectCls =
  'w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

/**
 * Cascading Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa.
 * value: { province, city, district, village } (nama), onChange(partial).
 */
export default function RegionSelect({ value = {}, onChange }) {
  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [districts, setDistricts] = useState([])
  const [villages, setVillages] = useState([])
  const [ids, setIds] = useState({ prov: '', reg: '', dist: '', vil: '' })
  const [error, setError] = useState(false)

  // Muat provinsi + resolusi nama tersimpan (mode edit) ke id
  useEffect(() => {
    let active = true
    const up = (s) => (s || '').toUpperCase()
    ;(async () => {
      const provs = await getJson(`${API}/provinces.json`)
      if (!active) return
      if (!provs.length) return setError(true)
      setProvinces(provs)
      if (!value.province) return
      const p = provs.find((x) => up(x.name) === up(value.province))
      if (!p) return
      const regs = await getJson(`${API}/regencies/${p.id}.json`)
      if (!active) return
      setRegencies(regs)
      const r = value.city && regs.find((x) => up(x.name) === up(value.city))
      if (!r) return setIds({ prov: p.id, reg: '', dist: '', vil: '' })
      const dists = await getJson(`${API}/districts/${r.id}.json`)
      if (!active) return
      setDistricts(dists)
      const d = value.district && dists.find((x) => up(x.name) === up(value.district))
      if (!d) return setIds({ prov: p.id, reg: r.id, dist: '', vil: '' })
      const vils = await getJson(`${API}/villages/${d.id}.json`)
      if (!active) return
      setVillages(vils)
      const v = value.village && vils.find((x) => up(x.name) === up(value.village))
      setIds({ prov: p.id, reg: r.id, dist: d.id, vil: v?.id || '' })
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selProvince = async (e) => {
    const id = e.target.value
    const name = provinces.find((p) => p.id === id)?.name || ''
    setIds({ prov: id, reg: '', dist: '', vil: '' })
    setRegencies([])
    setDistricts([])
    setVillages([])
    onChange({ province: name, city: '', district: '', village: '' })
    if (id) setRegencies(await getJson(`${API}/regencies/${id}.json`))
  }

  const selRegency = async (e) => {
    const id = e.target.value
    const name = regencies.find((r) => r.id === id)?.name || ''
    setIds((s) => ({ ...s, reg: id, dist: '', vil: '' }))
    setDistricts([])
    setVillages([])
    onChange({ city: name, district: '', village: '' })
    if (id) setDistricts(await getJson(`${API}/districts/${id}.json`))
  }

  const selDistrict = async (e) => {
    const id = e.target.value
    const name = districts.find((d) => d.id === id)?.name || ''
    setIds((s) => ({ ...s, dist: id, vil: '' }))
    setVillages([])
    onChange({ district: name, village: '' })
    if (id) setVillages(await getJson(`${API}/villages/${id}.json`))
  }

  const selVillage = (e) => {
    const id = e.target.value
    const name = villages.find((v) => v.id === id)?.name || ''
    setIds((s) => ({ ...s, vil: id }))
    onChange({ village: name })
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        Gagal memuat data wilayah. Periksa koneksi internet, atau isi kolom lokasi secara manual.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Provinsi">
        <select value={ids.prov} onChange={selProvince} className={selectCls}>
          <option value="">Pilih provinsi</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Kota / Kabupaten">
        <select value={ids.reg} onChange={selRegency} disabled={!ids.prov} className={selectCls}>
          <option value="">{ids.prov ? 'Pilih kota/kabupaten' : 'Pilih provinsi dulu'}</option>
          {regencies.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Kecamatan">
        <select value={ids.dist} onChange={selDistrict} disabled={!ids.reg} className={selectCls}>
          <option value="">{ids.reg ? 'Pilih kecamatan' : 'Pilih kota/kabupaten dulu'}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Kelurahan / Desa">
        <select value={ids.vil} onChange={selVillage} disabled={!ids.dist} className={selectCls}>
          <option value="">{ids.dist ? 'Pilih kelurahan/desa' : 'Pilih kecamatan dulu'}</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </Field>
    </div>
  )
}
