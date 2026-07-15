import { format } from "date-fns";

export const formatDate = (inputDate) => {
	const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
	return format(date, 'yyyy-MM-dd');
}

export const formatDateToMMDDYYYY = (dateString) => {
	const date = new Date(dateString);
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const year = date.getUTCFullYear();

	return `${month}-${day}-${year}`;
}

export const extractDate = (dateString, timeString) => {
	const date = new Date(dateString);

	const timezoneOffset = date.getTimezoneOffset() * 60000;
	const adjustedDate = new Date(date.getTime() - timezoneOffset);

	const year = adjustedDate.getFullYear();
	const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
	const day = String(adjustedDate.getDate()).padStart(2, '0');

	const formattedDate = `${year}-${month}-${day}`;

	const time = new Date(`January 1, 2000 ${timeString}`);

	const hours = String(time.getHours()).padStart(2, '0');
	const minutes = String(time.getMinutes()).padStart(2, '0');
	const seconds = String(time.getSeconds()).padStart(2, '0');

	const formattedTime = `${hours}:${minutes}:${seconds}`;

	return `${formattedDate} ${formattedTime}`;

}

export const sortByCreatedDate = (array: any[]) => {
	array.sort((a, b) => {
		const dateA = new Date(a.createdAt);
		const dateB = new Date(b.createdAt);

		if (dateA < dateB) {
			return 1;
		}
		if (dateA > dateB) {
			return -1;
		}

		return 0;
	});

	return array;
}

export const dateToCronExpression = (date: Date): string => {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = '*';

    return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }