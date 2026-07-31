import Link from 'next/link'
import { requireHousehold } from '@/lib/queries'
import AddBookForm from './AddBookForm'

export default async function AddPage() {
  await requireHousehold()

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-lg mx-auto p-6 space-y-6">
        <header>
          <Link
            href="/"
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ← Back to library
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">
            Add a book
          </h1>
        </header>
        <AddBookForm />
      </div>
    </main>
  )
}
