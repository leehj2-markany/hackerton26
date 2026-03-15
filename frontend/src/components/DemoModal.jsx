import { useEffect, useRef, useState } from 'react'

export default function DemoModal({ isOpen, onClose }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [isOpen])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setCurrentTime(video.currentTime)
    setProgress((video.currentTime / video.duration) * 100)
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }

  const handleProgressClick = (e) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    video.currentTime = ratio * video.duration
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-white/90">데모 영상</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none transition">&times;</button>
        </div>

        {/* Video */}
        <div className="relative bg-black aspect-video cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            src="/demo.mp4"
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 py-2.5 bg-gray-800 space-y-2">
          {/* Progress bar */}
          <div className="group cursor-pointer h-1.5 bg-gray-600 rounded-full overflow-hidden" onClick={handleProgressClick}>
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Time + play/pause */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={togglePlay} className="text-white/80 hover:text-white transition">
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <span className="text-xs text-white/60">{fmt(currentTime)} / {fmt(duration)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-900 border-t border-gray-700 text-center">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-200 transition">닫기</button>
          <span className="mx-3 text-gray-600">|</span>
          <button
            onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('openChatbot')) }}
            className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition"
          >
            직접 체험하기 →
          </button>
        </div>
      </div>
    </div>
  )
}