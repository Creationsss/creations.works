import { TIME } from "./constants.js";

const FINISHED_PROGRESS = 95;
const IN_PROGRESS_PROGRESS = 90;
const FINISHED_HOURS = 20;
const IN_PROGRESS_HOURS = 8;
const ESTIMATED_DURATION_HOURS = 12;

export function calculateProgress(timeListening, duration) {
	if (!duration || duration === 0) return 0;
	return (timeListening / duration) * 100;
}

export function isBookFinished(book) {
	if (book.mediaMetadata?.duration) {
		const progress = calculateProgress(
			book.timeListening,
			book.mediaMetadata.duration,
		);
		return progress >= FINISHED_PROGRESS;
	}
	return book.timeListening / TIME.SECONDS_PER_HOUR >= FINISHED_HOURS;
}

export function isBookInProgress(book) {
	if (!book.timeListening || book.timeListening === 0) return false;

	if (book.mediaMetadata?.duration) {
		const progress = calculateProgress(
			book.timeListening,
			book.mediaMetadata.duration,
		);
		return progress > 0 && progress < FINISHED_PROGRESS;
	}
	const hoursListened = book.timeListening / TIME.SECONDS_PER_HOUR;
	return hoursListened > 0 && hoursListened < FINISHED_HOURS;
}

export function isCurrentlyReading(progress) {
	if (progress.media?.metadata?.duration) {
		const progressPercent = calculateProgress(
			progress.currentTime,
			progress.media.metadata.duration,
		);
		return progressPercent > 0 && progressPercent < IN_PROGRESS_PROGRESS;
	}
	const hoursListened = progress.currentTime / TIME.SECONDS_PER_HOUR;
	return hoursListened > 0 && hoursListened < IN_PROGRESS_HOURS;
}

export function getEstimatedDuration(book) {
	return (
		book.mediaMetadata?.duration ||
		ESTIMATED_DURATION_HOURS * TIME.SECONDS_PER_HOUR
	);
}

export {
	FINISHED_PROGRESS,
	IN_PROGRESS_PROGRESS,
	FINISHED_HOURS,
	IN_PROGRESS_HOURS,
	ESTIMATED_DURATION_HOURS,
};
