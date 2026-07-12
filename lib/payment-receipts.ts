import "server-only";

import { generatePaymentReceiptPdfBuffer } from "@/lib/receipt-pdf";
import {
  buildReceiptR2Key,
  deleteFileFromR2,
  uploadFileToR2,
} from "@/lib/r2-storage";
import { formatCurrency, type PaymentMethod } from "@/lib/transactions";
import { formatFileSize } from "@/lib/documents";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ReceiptResult =
  | { ok: true; documentId?: string }
  | { ok: false; error: string };

type CreatePaymentReceiptDocumentParams = {
  supabase: SupabaseClient;
  transactionId: string;
  paymentId: string;
  fallbackReceivedBy?: string | null;
  createdByUserId?: string | null;
};

type CleanupPaymentReceiptParams = {
  supabase: SupabaseClient;
  paymentId: string;
  clearPaymentReference?: boolean;
};

type CleanupTransactionPaymentReceiptsParams = {
  supabase: SupabaseClient;
  transactionId: string;
};

type CleanupReceiptDocumentOptions = {
  clearPaymentReference?: boolean;
  paymentId?: string;
};

type RecreatePaymentReceiptDocumentParams = CreatePaymentReceiptDocumentParams;

export const PAYMENT_RECEIPT_DELETE_ERROR =
  "Makbuz belgesi silinemediği için ödeme silinmedi. Lütfen tekrar deneyin.";

export const TRANSACTION_RECEIPT_DELETE_ERROR =
  "İşleme bağlı makbuz belgeleri temizlenemediği için işlem silinmedi.";

type ReceiptTransaction = {
  id: string;
  transaction_no: string | null;
  patient_name: string;
  operation_description: string;
  sale_amount: number | string;
  staff_name: string | null;
};

type ReceiptPayment = {
  id: string;
  transaction_id: string;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number | string;
  description: string | null;
  received_by: string | null;
  receipt_document_id?: string | null;
};

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { error };
  }

  const knownError = error as {
    message?: unknown;
    stack?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };

  return {
    message: knownError.message,
    stack: knownError.stack,
    details: knownError.details,
    hint: knownError.hint,
    code: knownError.code,
    error,
  };
}

async function fetchReceiptContext(
  supabase: SupabaseClient,
  transactionId: string,
  paymentId: string,
) {
  const { data: transaction, error: transactionError } = await supabase
    .from("patient_transactions")
    .select(
      "id, transaction_no, patient_name, operation_description, sale_amount, staff_name",
    )
    .eq("id", transactionId)
    .single();

  if (transactionError || !transaction) {
    console.error("Receipt context transaction fetch failed", {
      transactionId,
      paymentId,
      error: transactionError ? errorDetails(transactionError) : null,
      hasTransaction: Boolean(transaction),
    });
    return { ok: false as const, error: "İşlem kaydı bulunamadı." };
  }

  const { data: payment, error: paymentError } = await supabase
    .from("transaction_payments")
    .select(
      "id, transaction_id, payment_date, payment_method, amount, description, received_by, receipt_document_id",
    )
    .eq("id", paymentId)
    .eq("transaction_id", transactionId)
    .single();

  if (paymentError || !payment) {
    console.error("Receipt context payment fetch failed", {
      transactionId,
      paymentId,
      error: paymentError ? errorDetails(paymentError) : null,
      hasPayment: Boolean(payment),
    });
    return { ok: false as const, error: "Ödeme kaydı bulunamadı." };
  }

  return {
    ok: true as const,
    transaction: transaction as ReceiptTransaction,
    payment: payment as ReceiptPayment,
  };
}

function receiptTitle(transaction: ReceiptTransaction) {
  return `Tahsilat Makbuzu - ${transaction.transaction_no ?? transaction.id} - ${
    transaction.patient_name
  }`;
}

function receiptDescription(
  transaction: ReceiptTransaction,
  payment: ReceiptPayment,
) {
  return `Otomatik oluşturulan tahsilat makbuzu. İşlem No: ${
    transaction.transaction_no ?? transaction.id
  }, Ödeme Tutarı: ${formatCurrency(payment.amount)}`;
}

function receiptFileName(transaction: ReceiptTransaction, payment: ReceiptPayment) {
  const transactionNo = (transaction.transaction_no ?? transaction.id)
    .replace(/[^\w-]+/g, "-")
    .toLowerCase();

  return `tahsilat-makbuzu-${transactionNo}-${payment.id}.pdf`;
}

export async function createPaymentReceiptDocument({
  supabase,
  transactionId,
  paymentId,
  fallbackReceivedBy,
  createdByUserId,
}: CreatePaymentReceiptDocumentParams): Promise<ReceiptResult> {
  const context = await fetchReceiptContext(supabase, transactionId, paymentId);

  if (!context.ok) {
    return { ok: false, error: "Tahsilat makbuzu oluşturulamadı." };
  }

  const { transaction, payment } = context;
  const r2Key = buildReceiptR2Key(transaction.id, payment.id);
  let buffer: Buffer;

  console.error("Receipt PDF params prepared", {
    transactionId,
    paymentId,
    transactionNo: transaction.transaction_no,
    r2Key,
  });

  try {
    console.error("Receipt PDF buffer generation started", {
      transactionId,
      paymentId,
    });
    buffer = await generatePaymentReceiptPdfBuffer({
      transaction,
      payment,
      fallbackReceivedBy,
    });
    console.error("Receipt PDF buffer generated", {
      transactionId,
      paymentId,
      bytes: buffer.length,
    });
  } catch (error) {
    console.error("Receipt PDF generation failed", {
      transactionId,
      paymentId,
      error: errorDetails(error),
    });
    return { ok: false, error: "Tahsilat makbuzu oluşturulamadı." };
  }

  try {
    console.error("Receipt PDF R2 upload started", {
      transactionId,
      paymentId,
      r2Key,
      bytes: buffer.length,
    });
    await uploadFileToR2({
      key: r2Key,
      body: buffer,
      contentType: "application/pdf",
      contentLength: buffer.length,
    });
    console.error("Receipt PDF R2 upload succeeded", {
      transactionId,
      paymentId,
      r2Key,
    });
  } catch (error) {
    console.error("Receipt PDF R2 upload failed", {
      transactionId,
      paymentId,
      r2Key,
      error: errorDetails(error),
    });
    return { ok: false, error: "Tahsilat makbuzu oluşturulamadı." };
  }

  console.error("Receipt document insert started", {
    transactionId,
    paymentId,
    r2Key,
  });
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      title: receiptTitle(transaction),
      file_name: receiptFileName(transaction, payment),
      description: receiptDescription(transaction, payment),
      file_path: r2Key,
      file_type: "pdf",
      file_size: formatFileSize(buffer.length),
      created_by: createdByUserId ?? null,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    console.error("Receipt document insert failed", {
      transactionId,
      paymentId,
      r2Key,
      error: documentError ? errorDetails(documentError) : null,
      hasDocument: Boolean(document),
    });
    await deleteFileFromR2(r2Key).catch((error) => {
      console.error("Receipt orphan R2 cleanup failed", {
        r2Key,
        error: errorDetails(error),
      });
    });
    return { ok: false, error: "Tahsilat makbuzu oluşturulamadı." };
  }

  console.error("Receipt document insert succeeded", {
    transactionId,
    paymentId,
    documentId: document.id,
  });

  console.error("Receipt payment update started", {
    transactionId,
    paymentId,
    documentId: document.id,
  });
  const { error: paymentUpdateError } = await supabase
    .from("transaction_payments")
    .update({
      receipt_document_id: document.id,
      receipt_generated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (paymentUpdateError) {
    console.error("Receipt payment update failed", {
      transactionId,
      paymentId,
      documentId: document.id,
      error: errorDetails(paymentUpdateError),
    });
    await supabase.from("documents").delete().eq("id", document.id);
    await deleteFileFromR2(r2Key).catch((error) => {
      console.error("Receipt R2 cleanup after payment update failed", {
        r2Key,
        error: errorDetails(error),
      });
    });
    return { ok: false, error: "Tahsilat makbuzu oluşturulamadı." };
  }

  console.error("Receipt payment update succeeded", {
    transactionId,
    paymentId,
    documentId: document.id,
  });

  return { ok: true, documentId: document.id };
}

async function clearPaymentReceiptReference(
  supabase: SupabaseClient,
  paymentId: string,
): Promise<ReceiptResult> {
  const { error: clearError } = await supabase
    .from("transaction_payments")
    .update({
      receipt_document_id: null,
      receipt_generated_at: null,
    })
    .eq("id", paymentId);

  if (clearError) {
    return { ok: false, error: "Tahsilat makbuzu silinemedi." };
  }

  return { ok: true };
}

async function cleanupReceiptDocumentById(
  supabase: SupabaseClient,
  documentId: string,
  options: CleanupReceiptDocumentOptions = {},
): Promise<ReceiptResult> {
  const { clearPaymentReference = false, paymentId } = options;

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    return { ok: false, error: "Tahsilat makbuzu silinemedi." };
  }

  if (!document) {
    if (clearPaymentReference && paymentId) {
      const clearResult = await clearPaymentReceiptReference(supabase, paymentId);
      if (!clearResult.ok) {
        return clearResult;
      }
    }

    console.error("Receipt document metadata missing during cleanup", {
      documentId,
      paymentId: paymentId ?? null,
    });
    return { ok: true };
  }

  if (document.file_path) {
    try {
      await deleteFileFromR2(document.file_path);
    } catch (error) {
      console.error("Receipt PDF R2 delete failed", {
        documentId,
        key: document.file_path,
        error: errorDetails(error),
      });
      return { ok: false, error: "Tahsilat makbuzu silinemedi." };
    }
  }

  const { error: deleteDocumentError } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (deleteDocumentError) {
    return { ok: false, error: "Tahsilat makbuzu silinemedi." };
  }

  if (clearPaymentReference && paymentId) {
    const clearResult = await clearPaymentReceiptReference(supabase, paymentId);
    if (!clearResult.ok) {
      return clearResult;
    }
  }

  return { ok: true };
}

export async function cleanupPaymentReceipt({
  supabase,
  paymentId,
  clearPaymentReference = true,
}: CleanupPaymentReceiptParams): Promise<ReceiptResult> {
  const { data: payment, error: paymentError } = await supabase
    .from("transaction_payments")
    .select("receipt_document_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError) {
    return { ok: false, error: "Tahsilat makbuzu silinemedi." };
  }

  if (!payment?.receipt_document_id) {
    return { ok: true };
  }

  return cleanupReceiptDocumentById(supabase, payment.receipt_document_id, {
    clearPaymentReference,
    paymentId,
  });
}

export async function cleanupTransactionPaymentReceipts({
  supabase,
  transactionId,
}: CleanupTransactionPaymentReceiptsParams): Promise<ReceiptResult> {
  const { data: payments, error: paymentsError } = await supabase
    .from("transaction_payments")
    .select("id, receipt_document_id")
    .eq("transaction_id", transactionId)
    .not("receipt_document_id", "is", null);

  if (paymentsError) {
    return { ok: false, error: "Tahsilat makbuzu silinemedi." };
  }

  for (const payment of payments ?? []) {
    const cleanupResult = await cleanupPaymentReceipt({
      supabase,
      paymentId: payment.id,
      clearPaymentReference: true,
    });

    if (!cleanupResult.ok) {
      return cleanupResult;
    }
  }

  return { ok: true };
}

/** @deprecated Use cleanupPaymentReceipt instead. */
export async function deletePaymentReceiptDocument(
  params: CleanupPaymentReceiptParams,
): Promise<ReceiptResult> {
  return cleanupPaymentReceipt(params);
}

export async function recreatePaymentReceiptDocument({
  supabase,
  transactionId,
  paymentId,
  fallbackReceivedBy,
  createdByUserId,
}: RecreatePaymentReceiptDocumentParams): Promise<ReceiptResult> {
  const { data: payment, error: paymentError } = await supabase
    .from("transaction_payments")
    .select("receipt_document_id")
    .eq("id", paymentId)
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (paymentError || !payment) {
    return { ok: false, error: "Tahsilat makbuzu yenilenemedi." };
  }

  const previousDocumentId = payment.receipt_document_id;

  const createResult = await createPaymentReceiptDocument({
    supabase,
    transactionId,
    paymentId,
    fallbackReceivedBy,
    createdByUserId,
  });

  if (!createResult.ok) {
    return { ok: false, error: "Tahsilat makbuzu yenilenemedi." };
  }

  if (
    previousDocumentId &&
    previousDocumentId !== createResult.documentId
  ) {
    const deleteOldResult = await cleanupReceiptDocumentById(
      supabase,
      previousDocumentId,
    );

    if (!deleteOldResult.ok) {
      console.error("Previous receipt cleanup after recreate failed", {
        transactionId,
        paymentId,
        previousDocumentId,
        error: deleteOldResult.error,
      });
    }
  }

  return createResult;
}

