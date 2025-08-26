import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Carregando</h1>
        <p className="text-slate-400 mb-6">Preparando redirecionamento...</p>
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-white text-sm">Aguarde um momento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
