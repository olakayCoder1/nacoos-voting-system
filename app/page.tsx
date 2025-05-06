"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-primary-foreground">Nacoss Voting System</h1>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Secure and Transparent Voting</h2>
              <p className="text-xl text-muted-foreground">
                Cast your vote securely for your preferred candidates. Our system ensures one vote per student using
                your unique matric number.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">Login to Vote</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/admin/login">Admin Login</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-lg border bg-card p-8 shadow-lg"
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Key Features</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>Secure authentication with matric number</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>Vote for multiple categories</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>Prevention of multiple votes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="rounded-full bg-primary p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span>Real-time results for admins</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Nacoss Voting System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
