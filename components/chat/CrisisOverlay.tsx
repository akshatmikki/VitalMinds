'use client'
import { useState } from 'react'
import { Heart, Phone, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type CrisisInfo = {
  crisis: boolean
  severity: 'low' | 'medium' | 'high'
  message: string
}

export default function CrisisOverlay({ crisis, onDismiss }: { crisis: CrisisInfo; onDismiss: () => void }) {
  const isHigh = crisis.severity === 'high'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`mx-3 mb-3 rounded-2xl p-4 border ${
          isHigh
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isHigh ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Heart className={`w-4 h-4 ${isHigh ? 'text-red-500' : 'text-amber-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold mb-1 ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>
              {isHigh ? 'You\'re not alone — help is here' : 'Checking in on you'}
            </p>
            <p className={`text-xs leading-relaxed mb-3 ${isHigh ? 'text-red-600' : 'text-amber-600'}`}>
              {crisis.message}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="tel:9152987821"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  isHigh ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-amber-500 text-white hover:bg-amber-600'
                } transition-colors`}
              >
                <Phone className="w-3 h-3" />
                iCall: 9152987821
              </a>
              <a
                href="tel:988"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-current text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                US: 988
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-warm-300 hover:text-warm-500 transition-colors p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
