
export const toStorageDate = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
};

export const getMondayOfWeek = (dateInput) => {
    let d;
    if (!dateInput) {
        d = new Date();
    } else {
        d = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    }
    d.setHours(0, 0, 0, 0);
    let day = d.getDay();
    let daysToSubtract = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - daysToSubtract);
    return toStorageDate(d);
};
