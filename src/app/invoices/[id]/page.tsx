interface InvoicePageProps {
    params: { id: string }
  }
  
  export default function InvoiceDetailPage({ params }: InvoicePageProps) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Invoice #{params.id}</h1>
        <p className="text-gray-600">Invoice details will be shown here.</p>
      </div>
    )
  }