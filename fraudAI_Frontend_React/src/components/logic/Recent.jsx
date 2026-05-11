"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpRight, ArrowDownLeft, ShieldCheck, ShieldAlert, Filter } from 'lucide-react'
import Header from "./Header"
import SidebarContent from "./SidebarContent"
import { db } from './firebase'
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { auth } from './firebase'

const STATUS_COLORS = {
  Completed: "bg-green-500/20 text-green-300",
  Pending: "bg-yellow-500/20 text-yellow-300",
  Failed: "bg-red-500/20 text-red-300",
};

const CATEGORIES = ["All", "Rent", "Utilities", "Groceries", "Entertainment", "Other"];

const RecentTransactions = () => {
  const [user, setUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [transactions, setTransactions] = useState([])
  const [activeCategory, setActiveCategory] = useState("All")

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return

      const userRef = doc(db, "users", currentUser.uid)
      const userDoc = await getDoc(userRef)
      if (!userDoc.exists()) return

      const userData = userDoc.data()
      setUser(userData)

      // Query by userId to get both outgoing AND incoming transactions
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", currentUser.uid)
      )
      const txSnapshot = await getDocs(transactionsQuery)
      const txList = txSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      setTransactions(txList)
    }
    fetchData()
  }, [])

  const filtered = transactions.filter((tx) => {
    const q = searchTerm.toLowerCase()
    const matchSearch =
      !searchTerm ||
      (tx.recipientUPI ?? "").toLowerCase().includes(q) ||
      (tx.senderUPI ?? "").toLowerCase().includes(q) ||
      (tx.amount ?? "").toString().includes(searchTerm) ||
      (tx.remarks ?? "").toLowerCase().includes(q)

    const matchCategory =
      activeCategory === "All" ||
      (tx.remarks ?? "other").toLowerCase() === activeCategory.toLowerCase()

    return matchSearch && matchCategory
  })

  const totalSpent   = transactions.filter(tx => tx.type !== "incoming").reduce((s, tx) => s + (tx.amount ?? 0), 0)
  const totalReceived = transactions.filter(tx => tx.type === "incoming").reduce((s, tx) => s + (tx.amount ?? 0), 0)
  const flaggedCount = transactions.filter(tx => tx.fraudVerdict === "FRAUD").length

  return (
    <div className="flex min-h-screen text-white">
      <aside className="hidden md:flex flex-col w-72 min-h-screen border-r border-white/[0.05] bg-slate-900/40 backdrop-blur-xl overflow-y-auto flex-shrink-0">
        <SidebarContent />
      </aside>

      <main className="flex-1">
        <Header user={user} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 space-y-5"
        >
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Transactions", value: transactions.length,               color: "text-cyan-400" },
              { label: "Total Spent",        value: `₹${totalSpent.toFixed(2)}`,       color: "text-red-400" },
              { label: "Total Received",     value: `₹${totalReceived.toFixed(2)}`,    color: "text-green-400" },
              { label: "AI Flagged",         value: flaggedCount, color: flaggedCount > 0 ? "text-orange-400" : "text-green-400" },
            ].map(s => (
              <Card key={s.label} className="bg-slate-900/80 border-white/[0.07]">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "bg-white/[0.07] text-slate-400 hover:bg-white/[0.09]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          <Card className="bg-slate-900/80 border-white/[0.07] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xl font-bold text-white">
                Transactions
                <span className="ml-2 text-sm text-slate-400 font-normal">({filtered.length})</span>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  className="pl-8 w-52 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">No transactions found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((tx) => {
                    const isFlagged    = tx.fraudVerdict === "FRAUD"
                    const isIncoming   = tx.type === "incoming"
                    const counterparty = isIncoming ? tx.senderUPI : tx.recipientUPI
                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                          isFlagged
                            ? "bg-red-500/5 border border-red-500/20 hover:bg-red-500/10"
                            : "bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {isIncoming
                              ? <ArrowDownLeft className="h-4 w-4 text-green-400" />
                              : <ArrowUpRight className="h-4 w-4 text-red-400" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isIncoming ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                                {isIncoming ? "From" : "To"}
                              </span>
                              <p className="font-medium text-white text-sm">{counterparty}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                              {tx.remarks ? ` · ${tx.remarks}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className={`text-sm font-semibold ${tx.type === 'incoming' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'incoming' ? '+' : '-'}₹{(tx.amount ?? 0).toFixed(2)}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status] ?? "bg-white/[0.09] text-slate-300"}`}>
                              {tx.status ?? "Unknown"}
                            </span>
                          </div>
                          {/* AI verdict badge */}
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            isFlagged
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-green-500/10 text-green-400"
                          }`}>
                            {isFlagged
                              ? <ShieldAlert className="h-3 w-3" />
                              : <ShieldCheck className="h-3 w-3" />
                            }
                            <span>{isFlagged ? "Flagged" : "Safe"}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

export default RecentTransactions
