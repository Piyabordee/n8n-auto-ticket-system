interface RefreshButtonProps {
  onRefresh: () => void
  loading: boolean
  lastUpdate: Date | null
}

export function RefreshButton({ onRefresh, loading, lastUpdate }: RefreshButtonProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-center justify-between">
      {lastUpdate && (
        <span className="text-sm text-gray-500">
          🔄 อัปเดตล่าสุด: {formatTime(lastUpdate)}
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white transition-colors`}
      >
        <span>{loading ? '⏳' : '🔄'}</span>
        <span>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</span>
      </button>
    </div>
  )
}
