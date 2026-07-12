export type ReminderStatus = "pending" | "completed" | "delayed" | "cancelled";

export type ReminderRecord = {
  id: string;
  reminder_date: string;
  reminder_time: string | null;
  title: string;
  patient_name: string | null;
  related_record: string | null;
  responsible_person: string | null;
  status: ReminderStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export const reminderStatusLabels: Record<ReminderStatus, string> = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
  delayed: "Ertelendi",
  cancelled: "İptal",
};

export const reminderStatusOptions: { value: ReminderStatus; label: string }[] =
  [
    { value: "pending", label: "Bekliyor" },
    { value: "completed", label: "Tamamlandı" },
    { value: "delayed", label: "Ertelendi" },
    { value: "cancelled", label: "İptal" },
  ];

export function formatReminderTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function getTodayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getWeekBounds(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function isActiveReminder(reminder: ReminderRecord) {
  return reminder.status === "pending" || reminder.status === "delayed";
}

export function summarizeReminders(reminders: ReminderRecord[]) {
  const today = getTodayDateString();
  const { start, end } = getWeekBounds();

  const todayCount = reminders.filter(
    (reminder) =>
      reminder.reminder_date === today && isActiveReminder(reminder),
  ).length;

  const overdueCount = reminders.filter(
    (reminder) =>
      reminder.reminder_date < today && isActiveReminder(reminder),
  ).length;

  const thisWeekCount = reminders.filter(
    (reminder) =>
      reminder.reminder_date >= start &&
      reminder.reminder_date <= end &&
      isActiveReminder(reminder),
  ).length;

  const completedCount = reminders.filter(
    (reminder) =>
      reminder.status === "completed" &&
      reminder.reminder_date >= start &&
      reminder.reminder_date <= end,
  ).length;

  return {
    todayCount,
    overdueCount,
    thisWeekCount,
    completedCount,
  };
}
