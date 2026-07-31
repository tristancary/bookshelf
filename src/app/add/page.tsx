import { requireHousehold } from '@/lib/queries'
import { AppBar } from '@/components/AppBar'
import { BottomNav } from '@/components/BottomNav'
import AddBookForm from './AddBookForm'

export default async function AddPage() {
  await requireHousehold()

  return (
    <>
      <AppBar title="Add a book" back={{ href: '/' }} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <AddBookForm />
      </main>
      <BottomNav />
    </>
  )
}
