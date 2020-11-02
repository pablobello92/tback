export {};

import Track from './../models/track';

export const getTracksCallback = (req: any, res: any): void => {
	const filter = {
		username: req.query.username,
		city: req.query.city,
		startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
	};
	getTracksByFilter(filter, parseInt(req.query.offset), parseInt(req.query.pages))
	.then(result => {
		res.send(result);
		res.end();
	})
	.catch(err => {
		console.error(err);
	});
}

const getTracksByFilter = async (filter: {}, offset: number, pages: number) => {
	try {
		const tracks: any[] = await Track.find(filter).sort([['startTime', -1]]).skip(offset).limit(pages);
		if (!tracks) {
			return [];
		}
		return tracks;
	} catch (error) {
		throw new Error(error);
	}
}

const discardRepairedSegments = (segments) => {
}