'use client';

import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-200 bg-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-gray-600">
        <div>
          <p className="font-bold text-gray-900 text-base mb-2">ABSON CV Genius</p>
          <p className="leading-relaxed">
            AI-powered CV generator. Create professional, standout CVs in minutes.
          </p>
        </div>

        <div>
          <p className="font-semibold text-gray-800 mb-3">Quick Links</p>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-gray-800 mb-3">Support</p>
          <p className="mb-1">Questions or feedback?</p>
          <a href="mailto:tukurmuhammed902@gmail.com" className="text-blue-600 hover:underline break-all">
            tukurmuhammed902@gmail.com
          </a>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {year} ABSON CV Genius. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
