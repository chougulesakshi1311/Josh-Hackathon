import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function Reports() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      <Sidebar />
      <main className="ml-64 flex flex-col min-h-screen">
        <Navbar />
        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
              Evaluation History
            </h2>
            <p className="text-on-surface-variant font-body">
              View your past credit evaluations and their generated reports.
            </p>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-10 ambient-shadow border border-outline-variant/10 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">history</span>
            <h3 className="font-headline font-bold text-lg text-on-surface">No historical records available</h3>
            <p className="text-sm text-on-surface-variant mt-2">Past evaluations will appear here once saved.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
