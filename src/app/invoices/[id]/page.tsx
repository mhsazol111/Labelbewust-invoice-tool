// @ts-nocheck

// src/app/invoices/[id]/page.tsx
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import InvoiceEditor from '@/components/InvoiceEditor';

export default async function InvoiceEditPage({ params }) {
  const invoiceId = params.id;

  if (!invoiceId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Invoice ID not provided</h1>
      </div>
    );
  }

  const docRef = doc(db, 'invoices', invoiceId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Invoice not found</h1>
        <p className="mt-2 text-gray-600">
          The invoice you're looking for doesn't exist or may have been deleted.
        </p>
      </div>
    );
  }

  const invoiceData = docSnap.data();

  return (
    <div className="container mx-auto py-8 px-4">
      <InvoiceEditor initialData={invoiceData} invoiceId={invoiceId} />
    </div>
  );
}
