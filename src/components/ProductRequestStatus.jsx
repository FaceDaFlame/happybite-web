export default function ProductRequestStatus({ loading, onRetry }) {
  return (
    <div
      role={loading ? 'status' : 'alert'}
      className="rounded-[30px] bg-white px-6 py-12 text-center shadow-soft"
    >
      <p className="text-sm text-muted">
        {loading ? 'Memuat produk...' : 'Gagal memuat produk. Coba lagi.'}
      </p>
      {!loading && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-white hover:bg-baked"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}
