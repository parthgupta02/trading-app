import { Timestamp } from 'firebase/firestore';

type DateInput = Timestamp | Date | number | string | { toDate: () => Date } | null | undefined;

export const toStorageDate = (date: DateInput): string => {
    const d = date && typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date as any);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const formatDate = (timestamp: DateInput): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp ? timestamp.toDate() : new Date(timestamp as any);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
};

export const formatDateTime = (timestamp: DateInput): string => {
    if (!timestamp) return 'N/A';
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp ? timestamp.toDate() : new Date(timestamp as any);
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace(',', '');
};

export const getMondayOfWeek = (dateInput: DateInput): string => {
    let d: Date;
    if (!dateInput) {
        d = new Date();
    } else {
        d = dateInput && typeof dateInput === 'object' && 'toDate' in dateInput ? dateInput.toDate() : new Date(dateInput as any);
    }
    d.setHours(0, 0, 0, 0);
    let day = d.getDay();
    let daysToSubtract = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - daysToSubtract);
    return toStorageDate(d);
};

export const toInputDateTime = (dateInput: DateInput): string => {
    if (!dateInput) return '';
    const d = dateInput && typeof dateInput === 'object' && 'toDate' in dateInput ? dateInput.toDate() : new Date(dateInput as any);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
