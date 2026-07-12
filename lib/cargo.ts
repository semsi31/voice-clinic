export type CargoStatus =
  | "prepared"
  | "shipped"
  | "delivered"
  | "returned"
  | "problem";

export type CargoRecord = {
  id: string;
  cargo_date: string;
  sender_name: string;
  process_description: string;
  cargo_company: string;
  cargo_branch: string | null;
  tracking_number: string | null;
  status: CargoStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const cargoStatusLabels: Record<CargoStatus, string> = {
  prepared: "Hazırlandı",
  shipped: "Gönderildi",
  delivered: "Teslim Edildi",
  returned: "İade Edildi",
  problem: "Sorunlu",
};

export const cargoStatusOptions: { value: CargoStatus; label: string }[] = [
  { value: "prepared", label: "Hazırlandı" },
  { value: "shipped", label: "Gönderildi" },
  { value: "delivered", label: "Teslim Edildi" },
  { value: "returned", label: "İade Edildi" },
  { value: "problem", label: "Sorunlu" },
];

export function summarizeCargoRecords(records: CargoRecord[]) {
  return {
    prepared: records.filter((record) => record.status === "prepared").length,
    shipped: records.filter((record) => record.status === "shipped").length,
    delivered: records.filter((record) => record.status === "delivered").length,
    problem: records.filter((record) => record.status === "problem").length,
  };
}
