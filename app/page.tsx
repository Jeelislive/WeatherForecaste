'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  SparklesIcon,
  MapPinIcon,
  BellIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from document
  useEffect(() => {
    const hasDark = document.documentElement.classList.contains('dark');
    setIsDark(hasDark);
  }, []);

  const toggleTheme = () => {
    const d = document.documentElement;
    const next = !isDark;
    d.classList.toggle('dark', next);
    setIsDark(next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white text-gray-900 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 dark:text-gray-100">
      {/* Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b border-gray-100 dark:supports-[backdrop-filter]:bg-gray-900/60 dark:bg-gray-900/60 dark:border-gray-800">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img src="/globe.svg" alt="Journey Planner" className="h-6 w-6" />
            <span className="font-semibold">Journey Planner</span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-secondary">Features</a>
            <a href="#how-it-works" className="hover:text-secondary">How it works</a>
            <a href="#testimonials" className="hover:text-secondary">Testimonials</a>
            <a href="#cta" className="hover:text-secondary">Get started</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            <a href="/login" className="hidden sm:inline text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Log in</a>
            <a href="/register" className="hidden md:inline-flex items-center rounded-lg bg-secondary text-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-secondary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">Sign up</a>
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </nav>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <a onClick={() => setMobileOpen(false)} href="#features" className="px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Features</a>
                <a onClick={() => setMobileOpen(false)} href="#how-it-works" className="px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">How it works</a>
                <a onClick={() => setMobileOpen(false)} href="#testimonials" className="px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Testimonials</a>
                <a onClick={() => setMobileOpen(false)} href="#cta" className="px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Get started</a>
                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                <a onClick={() => setMobileOpen(false)} href="/login" className="px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Log in</a>
                <a onClick={() => setMobileOpen(false)} href="/register" className="px-2 py-2 rounded bg-secondary text-white text-center">Sign up</a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-50" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-200 blur-3xl opacity-50" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight"
            >
              Plan smarter journeys with real‑time weather and AI guidance
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 text-lg text-gray-600 max-w-2xl"
            >
              Avoid storms, pick the best routes, and discover nearby highlights. Your personal travel copilot—powered by live forecasts and intelligent recommendations.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="/dashboard"
                className="inline-flex items-center rounded-xl bg-secondary text-white px-5 py-3 text-sm sm:text-base font-semibold shadow-sm hover:bg-secondary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                Get started
              </a>
              <a
                href="/near-me"
                className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-3 text-sm sm:text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                Explore nearby
              </a>
            </motion.div>

            <div className="mt-8 flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Live weather
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" />
                AI recommendations
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-purple-500" />
                Trip reports
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-blue-300/30 via-cyan-300/20 to-indigo-300/30 blur-2xl" />
            <div className="relative rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden dark:border-gray-800 dark:bg-gray-900">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-white text-sm">Journey Preview</div>
              <div className="p-6 grid gap-4">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Current location</p>
                      <p className="font-medium">Radar & clear skies</p>
                    </div>
                    <img src="/globe.svg" alt="map" className="h-10 w-10 opacity-80" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-sm text-gray-500">Smart route</p>
                  <p className="font-medium">Optimized to avoid rain at 4pm</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <p className="text-sm text-gray-500">Nearby highlights</p>
                  <p className="font-medium">Lakeview Point • Weather-safe today</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Everything you need for stress‑free travel</h2>
            <p className="mt-3 text-gray-600">Built for planners, explorers, and weekend warriors alike.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Live Weather Intelligence',
                desc: 'Minute‑by‑minute forecasts, radar, and alerts tailored to your route.',
                Icon: CloudIcon,
              },
              {
                title: 'AI Route Planner',
                desc: 'Get the best time to leave and the safest path based on conditions.',
                Icon: SparklesIcon,
              },
              {
                title: 'Nearby Highlights',
                desc: 'Discover scenic stops and hidden gems safe for the day’s forecast.',
                Icon: MapPinIcon,
              },
              {
                title: 'Trip Reports',
                desc: 'Export beautiful, shareable summaries of your journey.',
                Icon: CalendarDaysIcon,
              },
              {
                title: 'Notifications',
                desc: 'Get notified when weather changes may impact your plan.',
                Icon: BellIcon,
              },
              {
                title: 'Multi‑day Planning',
                desc: 'Compare days and choose the smoothest window to travel.',
                Icon: CalendarDaysIcon,
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-gray-900"
              >
                <f.Icon className="h-7 w-7 text-secondary" />
                <h3 className="mt-3 font-semibold text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gradient-to-b from-white to-blue-50/60 border-t border-gray-100 dark:from-gray-950 dark:to-gray-900/30 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Plan in three simple steps</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Enter your trip',
                desc: 'Pick origin, destination, and preferred times.',
              },
              {
                step: '2',
                title: 'Get smart insights',
                desc: 'We analyze weather and suggest the best window & route.',
              },
              {
                step: '3',
                title: 'Travel confidently',
                desc: 'Receive updates and adjust plans as conditions change.',
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold">Loved by travelers and commuters</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              {
                quote:
                  'We arrived on time despite a moving storm system. The AI timing tip saved our weekend trip.',
                name: 'Aarav, Roadtripper',
              },
              {
                quote:
                  'The nearby highlights are clutch—found a clear-sky viewpoint we would have missed.',
                name: 'Maya, Weekend explorer',
              },
            ].map((t) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <blockquote className="text-gray-700 dark:text-gray-300">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm text-gray-500 dark:text-gray-400">— {t.name}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section id="cta" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-12 sm:px-12 sm:py-16 text-white shadow-xl dark:border-gray-800">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold">Start your next journey with confidence</h3>
                <p className="mt-2 text-white/90">
                  Create a plan in minutes. Adjust as you go. Let weather work for you—not against you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <a
                  href="/dashboard"
                  className="inline-flex items-center rounded-xl bg-white text-blue-700 px-5 py-3 text-sm sm:text-base font-semibold shadow-sm hover:bg-blue-50"
                >
                  Open dashboard
                </a>
                <a
                  href="/report"
                  className="inline-flex items-center rounded-xl border border-white/70 px-5 py-3 text-sm sm:text-base font-semibold text-white hover:bg-white/10"
                >
                  Generate report
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/globe.svg" alt="Journey Planner" className="h-5 w-5" />
            <span className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} Journey Planner</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <a className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="/near-me">Near me</a>
            <a className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="/notifications">Notifications</a>
            <a className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" href="/dashboard">Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}