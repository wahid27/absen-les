import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Calendar, Image as ImageIcon, CheckCircle2, XCircle, 
  Clock, MapPin, Phone, GraduationCap, ChevronRight, 
  Upload, User, Lock, Save, Camera, Trash2, Plus, Check,
  MessageCircle, Star, ShieldCheck, Heart, Sparkles, BookOpen,
  Loader2, AlertCircle, RefreshCw, Send, X, ChevronDown, ChevronUp, BarChart2,
  Maximize2
} from 'lucide-react';

// URL API Google Apps Script Anda (PASTIKAN SUDAH NEW DEPLOYMENT)
const API_URL = "https://script.google.com/macros/s/AKfycbwyGKsYPR0m0j3J4LtwThc9xuHnlRjAAogX4cu4R3KVagGxCLEju9_PZCukKkMBsQmBfQ/exec".trim();

// ─────────────────────────────────────────────────────────────
// Komponen Avatar Lucu Otomatis (FITUR BARU)
// ─────────────────────────────────────────────────────────────
const StudentAvatar = ({ name, size = "md" }) => {
  const s = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-20 h-20" : "w-10 h-10";
  // Menggunakan style 'notionists' atau 'adventurer' agar terlihat premium dan lucu
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`;
  
  return (
    <div className={`${s} rounded-full bg-white overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm`}>
      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Komponen gambar via Proxy Apps Script (KODE DARI ANDA)
// ─────────────────────────────────────────────────────────────
const ProxyImage = ({ fileId, alt, className }) => {
  const [src, setSrc] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!fileId) { setStatus('error'); return; }
    let cancelled = false;
    setStatus('loading');
    setSrc(null);
    fetch(`${API_URL}?action=imgb64&id=${encodeURIComponent(fileId)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.status === 'ok' && data.dataUri) { setSrc(data.dataUri); setStatus('ok'); }
        else setStatus('error');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [fileId]);

  if (status === 'loading') return (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-slate-400" />
    </div>
  );
  if (status === 'error') return (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-1 text-center p-2">
      <ImageIcon size={22} className="text-slate-300 mx-auto" />
      <p className="text-[10px] text-slate-400">Gagal memuat gambar</p>
    </div>
  );
  return <img src={src} alt={alt} className={className} />;
};

// --- NOTIFIKASI KUSTOM ---
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const colors = type === 'error' ? 'bg-red-500' : 'bg-emerald-500';
  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[9999] ${colors} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4`}>
      {type === 'error' ? <AlertCircle size={24}/> : <CheckCircle2 size={24}/>}
      <p className="font-bold text-sm leading-tight">{String(message)}</p>
      <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={18}/></button>
    </div>
  );
};

// --- KOMPONEN IMAGE MODAL (FITUR ZOOM) ---
const ImageModal = ({ fileId, onClose }) => {
  if (!fileId) return null;
  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-all"
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <div className="max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <ProxyImage 
          fileId={fileId} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Helpers Tanggal
// ─────────────────────────────────────────────────────────────
const formatDateIndo = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
      return `${parts[2]} ${months[parseInt(parts[1]) - 1]}`;
    }
  } catch(e) {}
  return dateStr;
};

const formatFullDateIndo = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
    }
  } catch(e) {}
  return dateStr;
};

// ─────────────────────────────────────────────────────────────
// Komponen Rekap Bulanan (FIXED: BISA MINIMIZE)
// ─────────────────────────────────────────────────────────────
const RekapBulanan = ({ attendance }) => {
  const [bulanAktif, setBulanAktif] = useState(null);

  const validAttendance = (attendance || []).filter(item => item.date && item.status);

  const perBulan = {};
  validAttendance.forEach(item => {
    const key = item.monthLabel || "Lainnya";
    if (!perBulan[key]) perBulan[key] = [];
    perBulan[key].push(item);
  });

  const daftarBulan = Object.keys(perBulan);

  useEffect(() => {
    if (daftarBulan.length > 0) {
      setBulanAktif(daftarBulan[daftarBulan.length - 1]);
    }
  }, [attendance]);

  const totalHadir = validAttendance.length;

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
      <h3 className="text-xl font-serif mb-2 flex items-center gap-2 tracking-tight text-slate-900">
        <BarChart2 size={20} /> Rekap Kehadiran
      </h3>
      <p className="text-sm text-slate-400 mb-6">Total seluruh waktu: <span className="font-bold text-slate-700">{totalHadir} pertemuan</span></p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {daftarBulan.map(bulan => {
          const jumlah = perBulan[bulan].length;
          const isAktif = bulanAktif === bulan;
          return (
            <button
              key={bulan}
              onClick={() => setBulanAktif(isAktif ? null : bulan)}
              className={`text-left p-5 rounded-2xl border transition-all active:scale-95 ${
                isAktif
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                  : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${isAktif ? 'text-slate-400' : 'text-slate-400'}`}>
                  {bulan}
                </span>
                {isAktif ? <ChevronUp size={14} /> : <ChevronDown size={14} className="text-slate-400" />}
              </div>

              <div className={`h-1.5 rounded-full mb-3 ${isAktif ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div
                  className={`h-1.5 rounded-full transition-all ${isAktif ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min((jumlah / 26) * 100, 100)}%` }}
                />
              </div>

              <div className="flex items-end gap-1">
                <span className={`text-3xl font-bold leading-none ${isAktif ? 'text-white' : 'text-slate-900'}`}>
                  {jumlah}
                </span>
                <span className={`text-sm mb-0.5 ${isAktif ? 'text-slate-400' : 'text-slate-400'}`}>
                  pertemuan
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {bulanAktif && perBulan[bulanAktif] && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Detail kehadiran — {bulanAktif}
          </p>
          <div className="flex flex-wrap gap-2">
            {perBulan[bulanAktif]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl"
                >
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-800">{formatDateIndo(item.date)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- KOMPONEN WHATSAPP ---
const FloatingWA = () => (
  <a 
    href="https://wa.me/6281234567890" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-[999] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group"
  >
    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-medium whitespace-nowrap text-sm px-0 group-hover:px-2">
      Daftar Sekarang
    </span>
    <MessageCircle size={28} />
  </a>
);

// ─────────────────────────────────────────────────────────────
// Landing Page (LONG VERSION RESTORED)
// ─────────────────────────────────────────────────────────────
const LandingPage = ({ setActiveTab }) => (
  <div className="animate-in fade-in duration-1000">
    <section className="relative h-screen flex items-center justify-center bg-white overflow-hidden text-center">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 border border-slate-900 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 border border-slate-900 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-slate-900 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 mb-8 transition-transform hover:scale-105">
          <Sparkles size={16} className="text-amber-500" />
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500">Premium Tutoring Service</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-serif text-slate-900 mb-8 tracking-tight leading-[1.1]">
          LES Bu <span className="text-slate-400 italic">PIPIT</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Mendampingi langkah belajar buah hati dengan pendekatan personal, lingkungan yang tenang, dan pelaporan yang transparan untuk hasil belajar yang maksimal.
        </p>
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => setActiveTab('report')} 
            className="px-10 py-5 bg-slate-900 text-white rounded-full flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all font-medium group"
          >
            Cek Laporan Belajar <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
            <p className="text-sm font-medium tracking-wide">Scroll ke bawah untuk mengenal kami lebih dekat</p>
            <span className="text-xl">↓</span>
          </div>
        </div>
      </div>
    </section>
    
    <section className="py-32 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-4xl font-serif mb-6 text-slate-900">Kualitas yang Kami Prioritaskan</h2>
          <p className="text-slate-500 leading-relaxed">
            Setiap anak memiliki cara belajar yang unik. Di LES Bu Pipit, kami tidak hanya sekedar memberikan pengajaran materi sekolah, tapi membimbing potensi mereka agar berkembang maksimal.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 transition-transform hover:-translate-y-2">
            <BookOpen size={28} className="mx-auto mb-6 text-indigo-600" />
            <h3 className="text-xl font-serif mb-4 text-slate-900">Kurikulum Adaptif</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Materi disesuaikan dengan kurikulum sekolah dan kecepatan pemahaman siswa.</p>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 transition-transform hover:-translate-y-2">
            <Heart size={28} className="mx-auto mb-6 text-rose-600" />
            <h3 className="text-xl font-serif mb-4 text-slate-900">Pendekatan Personal</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Satu guru mendampingi secara intensif, menciptakan suasana belajar yang nyaman.</p>
          </div>
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 transition-transform hover:-translate-y-2">
            <ShieldCheck size={28} className="mx-auto mb-6 text-emerald-600" />
            <h3 className="text-xl font-serif mb-4 text-slate-900">Laporan Transparan</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Pantau perkembangan anak setiap saat melalui dokumentasi yang dapat diakses online.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 block">Tentang Program</span>
            <h2 className="text-5xl font-serif mb-8 leading-tight text-slate-900">Membangun Karakter Melalui Pendidikan</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">1</div>
                <div>
                  <h4 className="font-bold mb-2 text-slate-900">Fasilitas Nyaman</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Ruang belajar bersih dan tenang di lingkungan perumahan, mendukung konsentrasi maksimal.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-lg">2</div>
                <div>
                  <h4 className="font-bold mb-2 text-slate-900">Metode Fun Learning</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Belajar jadi menyenangkan dengan media interaktif dan apresiasi bagi setiap pencapaian anak.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-slate-100 rounded-[60px] overflow-hidden flex items-center justify-center border border-slate-50 shadow-inner text-center">
               <p className="text-slate-300 font-serif italic text-xl p-12">[Gambar Suasana Belajar LES Bu Pipit]</p>
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 max-w-xs animate-in slide-in-from-left-4 duration-700">
              <div className="flex gap-2 text-amber-500 mb-4">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <p className="text-sm italic text-slate-600 mb-4">"Sejak les di Bu Pipit, anak saya lebih semangat mengerjakan PR dan nilai ujiannya meningkat drastis."</p>
              <p className="text-xs font-bold text-slate-900">— Mama Keisya</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="py-24 bg-slate-900 text-white text-center">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-serif mb-6">Siap Memberikan yang Terbaik untuk Buah Hati?</h2>
        <p className="text-slate-400 mb-10 max-w-xl mx-auto font-light text-lg">Kuota pendaftaran sangat terbatas untuk menjaga kualitas pengajaran personal.</p>
        <button 
          className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto shadow-2xl"
          onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
        >
          Hubungi Admin Via WhatsApp <MessageCircle size={20} />
        </button>
      </div>
    </section>
  </div>
);

// ─────────────────────────────────────────────────────────────
// App Utama
// ─────────────────────────────────────────────────────────────
const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchName, setSearchName] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [notif, setNotif] = useState(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const passwordRef = useRef(null);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const showNotif = (msg, type = 'success') => { setNotif({ message: msg, type }); setTimeout(() => setNotif(null), 5000); };

  const fetchStudents = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}?action=getStudents`);
      const students = await res.json();
      if (Array.isArray(students)) setAttendanceList(students.map(name => ({ name: String(name), present: false })));
    } catch (err) { console.error(err); showNotif("Gagal sinkron nama", "error"); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    if (activeTab === 'admin' && isAdminLoggedIn) fetchStudents();
    if (activeTab === 'admin' && !isAdminLoggedIn) setTimeout(() => { if (passwordRef.current) passwordRef.current.focus(); }, 150);
  }, [activeTab, isAdminLoggedIn]);

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        let w = img.width, h = img.height;
        if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  });

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (photoPreviews.length + files.length > 3) return showNotif("Maksimal 3 foto", "error");
    setSubmitStatus('loading');
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f)));
      setPhotoPreviews(prev => [...prev, ...compressed]);
    } finally { setSubmitStatus('idle'); }
  };

  const handleFinalSubmit = async () => {
    const selected = attendanceList.filter(s => s.present);
    if (selected.length === 0) return showNotif("Pilih minimal satu siswa hadir", "error");
    if (!window.confirm("Kirim laporan sekarang?")) return;
    setSubmitStatus('loading');
    const selectedDate = new Date(attendanceDate);
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(selectedDate);
    try {
      await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: "SUBMIT_REPORT", date: attendanceDate, month: monthName, attendanceList: selected, images: photoPreviews }) });
      setSubmitStatus('success');
      setTimeout(() => { setAttendanceList(prev => prev.map(s => ({ ...s, present: false }))); setPhotoPreviews([]); setSubmitStatus('idle'); showNotif("Laporan berhasil terkirim!"); }, 2000);
    } catch (err) { setSubmitStatus('error'); showNotif("Gagal koneksi", "error"); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    setLoading(true); setReportData(null); setShowAllPhotos(false);
    try {
      const res = await fetch(`${API_URL}?action=getReport&name=${encodeURIComponent(searchName.trim())}`);
      const resText = await res.text();
      const data = JSON.parse(resText);
      if (data && data.attendance?.length > 0) setReportData(data);
      else showNotif("Nama tidak ditemukan", "error");
    } catch (err) { showNotif("Gagal ambil data", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <FloatingWA />
      <Toast message={notif?.message} type={notif?.type} onClose={() => setNotif(null)} />
      
      {/* ZOOM MODAL */}
      <ImageModal fileId={selectedImageId} onClose={() => setSelectedImageId(null)} />

      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-20 flex items-center px-6 justify-between text-slate-900">
        <div className="text-xl font-serif tracking-tighter cursor-pointer" onClick={() => setActiveTab('home')}>LES BU PIPIT</div>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('report')} className={`text-sm font-medium transition-colors ${activeTab === 'report' ? 'text-slate-900' : 'text-slate-400'}`}>Laporan</button>
          <button onClick={() => setActiveTab('admin')} className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>Admin</button>
        </div>
      </nav>

      <main className="pt-20">
        {activeTab === 'home' && <LandingPage setActiveTab={setActiveTab} />}
        
        {activeTab === 'report' && (
          <div className="container mx-auto max-w-5xl py-12 px-4 animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 mb-12 text-center md:text-left">
              <h2 className="text-3xl font-serif text-slate-900 mb-2 tracking-tight">Portal Laporan Orang Tua</h2>
              <p className="text-slate-500 mb-8">Masukkan nama lengkap buah hati Anda untuk memantau rekapitulasi belajar.</p>
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Masukkan Nama Siswa" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Lihat Laporan"}
                </button>
              </form>
            </div>
            
            {reportData && (
              <div className="space-y-8 animate-in zoom-in-95">
                {/* HEAD HAS AVATAR (FITUR BARU) */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex items-center gap-6 overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none"><GraduationCap size={120} /></div>
                   <StudentAvatar name={reportData.name} size="lg" />
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Laporan Belajar</p>
                     <h2 className="text-3xl font-serif text-slate-900 tracking-tight capitalize">{reportData.name}</h2>
                   </div>
                </div>

                <RekapBulanan attendance={reportData.attendance} />

                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-serif mb-6 flex items-center gap-2 tracking-tight text-slate-900">
                    <ImageIcon size={20} /> Dokumentasi Sesi Belajar
                  </h3>
                  {reportData.dailyGallery && reportData.dailyGallery.length > 0 ? (
                    <div className="space-y-12">
                      {(showAllPhotos ? reportData.dailyGallery : reportData.dailyGallery.slice(0, 3)).map((day, idx) => (
                        <div key={idx} className="border-b border-slate-50 pb-10 last:border-0">
                          <p className="font-bold text-slate-400 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest bg-slate-50 w-fit px-4 py-2 rounded-full">
                            <Clock size={14} /> Tanggal: {formatFullDateIndo(day.date)}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {(day.fileIds || []).map((fileId, uIdx) => (
                              <div 
                                key={uIdx} 
                                className="aspect-video rounded-3xl overflow-hidden border border-slate-100 shadow-sm group bg-slate-50 relative cursor-zoom-in"
                                onClick={() => setSelectedImageId(fileId)}
                              >
                                <ProxyImage fileId={fileId} alt={`Kegiatan ${day.date}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {!showAllPhotos && reportData.dailyGallery.length > 3 && (
                        <button 
                          onClick={() => setShowAllPhotos(true)}
                          className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-dashed border-slate-200"
                        >
                          Lihat Dokumentasi Lengkap ({reportData.dailyGallery.length - 3} Hari Lainnya) <ChevronDown size={18} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">
                      Belum ada dokumentasi foto yang tersedia untuk bulan ini.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'admin' && (
          <div className="container mx-auto max-w-6xl py-12 px-4 animate-in fade-in">
            {!isAdminLoggedIn ? (
              <div className="flex items-center justify-center h-[50vh]">
                <form onSubmit={(e) => { e.preventDefault(); if(adminPassword === 'pipit123') setIsAdminLoggedIn(true); else showNotif("Password salah!", "error"); }} className="bg-white p-8 rounded-3xl border w-full max-w-sm shadow-sm">
                  <h2 className="text-2xl font-serif text-center mb-6 text-slate-900">Login Admin</h2>
                  <input ref={passwordRef} type="password" placeholder="Password" className="w-full p-4 bg-slate-50 rounded-xl mb-4 outline-none transition-all focus:ring-2 focus:ring-slate-100" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                  <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all">Masuk</button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 bg-white rounded-3xl border shadow-sm overflow-hidden h-[600px] flex flex-col w-full">
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-3"><User size={20} /><h3 className="font-serif text-lg">Presensi Siswa</h3></div>
                      <div className="flex items-center gap-4">
                        <button onClick={fetchStudents} className="hover:text-slate-300 transition-colors"><RefreshCw size={16} className={syncing ? "animate-spin" : ""} /></button>
                        <input type="date" className="bg-slate-800 border-none rounded text-xs px-3 py-1 outline-none text-white focus:ring-1 focus:ring-slate-500" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1 grid sm:grid-cols-2 gap-3 content-start text-sm">
                      {attendanceList.map((s) => (
                        <div key={s.name} onClick={() => setAttendanceList(prev => prev.map(item => item.name === s.name ? {...item, present: !item.present} : item))} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${s.present ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[0.98]' : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}>
                          <div className="flex items-center gap-3">
                             <StudentAvatar name={s.name} size="sm" />
                             <span className="font-medium">{s.name}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${s.present ? 'bg-white text-slate-900' : 'bg-white border-slate-200'}`}>{s.present && <Check size={12} strokeWidth={4} />}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full md:w-80 bg-white rounded-3xl border shadow-sm h-fit overflow-hidden">
                    <div className="bg-slate-800 p-6 text-white flex items-center gap-3 shadow-md"><ImageIcon size={20} /><h3 className="font-serif text-sm">Dokumentasi</h3></div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {photoPreviews.map((src, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border shadow-sm group">
                            <img src={src} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                            <button onClick={() => setPhotoPreviews(p => p.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg shadow-lg">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                        {photoPreviews.length < 3 && (
                          <label className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer transition-all hover:border-slate-300">
                            <Camera size={20} />
                            <span className="text-[10px] mt-1 font-bold">AMBIL</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} multiple />
                          </label>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 italic leading-tight text-center">Maksimal 3 foto. Kompresi otomatis aktif.</p>
                    </div>
                  </div>
                </div>
                <div className="max-w-6xl mx-auto">
                   <button 
                    onClick={handleFinalSubmit} 
                    disabled={submitStatus === 'loading' || attendanceList.filter(s => s.present).length === 0} 
                    className={`w-full py-6 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl
                      ${submitStatus === 'success' ? 'bg-emerald-500 text-white' : 
                        submitStatus === 'error' ? 'bg-rose-500 text-white' : 
                        'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 disabled:opacity-50'}`}
                   >
                    {submitStatus === 'loading' ? <Loader2 className="animate-spin" size={24} /> : 
                     submitStatus === 'success' ? <><CheckCircle2 size={24}/> Laporan Terkirim!</> : 
                     <><Send size={24}/> SIMPAN LAPORAN HARI INI</>}
                   </button>
                   <p className="text-center mt-4 text-sm text-slate-400 italic">Data presensi dan foto disimpan secara otomatis ke Spreadsheet dan Drive.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="py-12 border-t border-slate-50 bg-slate-50/50 text-center text-slate-300 text-xs italic"><p>© 2026 LES Bu PIPIT. All rights reserved.</p></footer>
    </div>
  );
};

export default App;