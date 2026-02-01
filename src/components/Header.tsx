"use client";

import Link from "next/link";
import AuthNav from "@/components/auth/AuthNav";

export default function Header() {
  return (
    <header className="h-auto border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:h-[72px] md:flex-row md:items-center md:justify-between md:py-0">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <span className="text-base font-bold">MCS</span>
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold">MCS</div>
              <div className="text-xs text-slate-500">My Classroom Sheets</div>
            </div>
          </Link>
          <button className="text-sm font-medium text-slate-600 md:hidden">Menu</button>
        </div>

        <div className="w-full md:flex-1 md:px-8">
          <div className="relative mx-auto w-full max-w-[720px]">
            <input
              className="w-full rounded-full bg-slate-100 px-5 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Search worksheets, topics, or grade"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-5 text-sm md:flex">
          <a className="text-slate-600 hover:text-slate-900" href="/pricing">
            Pricing
          </a>
          <a className="text-slate-600 hover:text-slate-900" href="/bundles">
            Bundles
          </a>
          <a
            className="rounded-full bg-slate-900 px-5 py-2 text-white hover:bg-slate-800"
            href="/products"
          >
            Browse Resources
          </a>
          <AuthNav />
        </div>

        <div className="flex items-center gap-4 text-sm md:hidden">
          <a className="text-slate-600" href="/pricing">
            Pricing
          </a>
          <a className="text-slate-600" href="/bundles">
            Bundles
          </a>
          <a className="text-slate-600" href="/products">
            Browse
          </a>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
