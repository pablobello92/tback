export {};

import express from 'express';
import PredictedRoadTypes from '../models/prediction';
import {
    map,
    switchMap
} from 'rxjs/operators';
import { 
    from,
    Observable
} from 'rxjs';
import {
    Tensor4D,
    tensor4d,
    Tensor,
    loadLayersModel,
    Rank,
    LayersModel
} from '@tensorflow/tfjs-node';
import {
    findMatchingSegment,
    getTracksMapByCity
} from './tracks';
import {
    IAccelerometer,
    IRange,
    ISegment,
    ISumarizedObject,
    ISumarizingObject,
    ITrack
} from '../interfaces/Tracks';
import { 
    IPredictionSegment,
    TensorSample
} from '../interfaces/Predictions';
import { 
    PATHS,
    TENSOR_SAMPLE_SIZE
} from '../shared/constants';

export const executePredictionsCallback = (req: express.Request, res: express.Response): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR');
    console.log('----------------');

    const type: number = parseInt(req.body.type);
    const filter: any = {
        id: req.body.linkedCities
    };

    getTracksMapByCity(filter, 'cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sampleTracksByCity(allData, type)),
            switchMap((allData: ISumarizedObject[]) => predictSamplesByCity(allData)),
            switchMap((predictionsByCity: ISumarizedObject[]) => replacePredictions(predictionsByCity, type))
        )
        .subscribe((result: any) => {
            res.status(200).end();
        }, (error: Error) => {
            res.status(500).end();
        });
}

const predictSamplesByCity = (items: ISumarizedObject[]): Observable<ISumarizedObject[]> =>
    from(loadModel(PATHS.ROADS))
    .pipe(
        map((model: LayersModel) => {
            return items.map((item: ISumarizedObject) => addScores(model, item))
        })
    )

const loadModel = (path: string): Promise<LayersModel | Error> =>
    loadLayersModel(path)
    .catch((error: any) => new Error(error))

const addScores = (model: LayersModel, item: ISumarizedObject): ISumarizedObject => 
    <ISumarizedObject>{
        type: item.type,
        cityId: item.cityId,
        date: item.date,
        ranges: item.ranges.map((r: IPredictionSegment) => 
            <ISegment> {
                start: r.start,
                end: r.end,
                date: r.date,
                distance: r.distance,
                score: calculateScore(r.samples, item.type, model)
            }
        )
    }

const calculateScore = (samples: TensorSample[], type: number, model: LayersModel): number => {
    const WINDOWS = (samples.length / TENSOR_SAMPLE_SIZE);
    let scores: number[] = [];
    for (let i = 0; i < WINDOWS; i++) {
        let temp = samples.slice(i * TENSOR_SAMPLE_SIZE, (i * TENSOR_SAMPLE_SIZE) + TENSOR_SAMPLE_SIZE);
        const predictionResult = predictSample([temp] as number[][][][], model);
        const score = getPredominantType(predictionResult);
        scores.push(score);
    }
    return getCommon(scores);
}

const predictSample = (sample: any, model: LayersModel): any => {
    const tensor: Tensor4D = tensor4d(sample);
    const result: Tensor<Rank> = model.predict(tensor) as Tensor;
    return result.dataSync();
}

// TODO: check the undefined cases!!!
const getPredominantType = (array: Float32Array): number => {
    return array.indexOf(Math.max(...array));
}

const getCommon = (items: number[]): number => {
    let count = 0;
    let higherCount = 1;
    let result: number;
    for (let i = 0; i < items.length; i++) {
        for (let j = i; j < items.length; j++) {
            if (items[i] == items[j])
                count++;
                if (higherCount < count) {
                    higherCount = count; 
                    result = items[i];
                }
        }
        count = 0;
    }
    return result;
}

const sampleTracksByCity = (items: ISumarizingObject[], type: number): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) =>
		<ISumarizedObject> {
            type,
			cityId: item.cityId,
			date: Date.parse(new Date().toDateString()),
			ranges: sampleTracks(item)
		}
	);

const sampleTracks = (item: ISumarizingObject): IPredictionSegment[] => {
	const result: IPredictionSegment[] = [];

	let ranges: IRange[] = [];
	let accelerometers: IAccelerometer[] = [];
	let segments: IPredictionSegment[] = [];

	item.tracks.forEach((track: ITrack) => {
		ranges.push(...track.ranges);
		accelerometers.push(...track.accelerometers);
	});

	segments = ranges.map((r: IRange) => mapToPredictionSegment(r, accelerometers));

	segments.forEach((s: IPredictionSegment) => {
		const index = findMatchingSegment(s, result);
		if (index === -1) {
			result.push(s);
		} else {
			const matching = result.splice(index, 1)[0];
			const merged = getMergedSegment(s, matching);
			result.push(merged);
		}
	});

	result.forEach((s: IPredictionSegment) => {
		addEmptySamples(s.samples, TENSOR_SAMPLE_SIZE);
	});

	return result;
}

const getMergedSegment = (toAdd: IPredictionSegment, matching: IPredictionSegment): IPredictionSegment => {
	const {
		id,
		samples,
		...relevantFields
	} = matching;
	return <IPredictionSegment> {
		...relevantFields,
		id: [...toAdd.id, ...matching.id],
		samples: [...toAdd.samples, ...matching.samples]
	};
}

const mapToPredictionSegment = (range: IRange, accelerometers: IAccelerometer[]): IPredictionSegment => {
	const {
		id,
		speed,
		stabilityEvents,
		...relevantFields
	} = range;
	return <IPredictionSegment> {
		...relevantFields,
		id: [range.id],
		samples: getSamples(range.id, accelerometers)
	};
}

const getSamples = (id: number, accelerometers: IAccelerometer[]): number[][][] =>
	accelerometers
		.filter((a: IAccelerometer) => a.id === id)
		.map((a: IAccelerometer) => getTensorSample(a));

const replacePredictions = (values: any, type: number): Observable<Error | any> =>
    from(removePredictions({ type }))
    .pipe(
        switchMap((res: any) => insertPredictions(values))
    );

const removePredictions = (filter: {}): Promise<Error | any> =>
    PredictedRoadTypes.deleteMany(filter)
        .catch((error: any) => new Error(error));

const insertPredictions = (values: any): Promise<Error | any> =>
    PredictedRoadTypes.insertMany(values)
        .catch((error: any) => new Error(error));

export const getTensorSample = (a?: IAccelerometer): TensorSample =>
    (a !== null) ? [
        [a.x.raw],
        [a.y.raw],
        [a.z.raw],
        [a.x.diff],
        [a.y.diff],
        [a.z.diff]
    ] : 
    [
        [0],
        [0],
        [0],
        [0],
        [0],
        [0]
    ];

export const addEmptySamples = (samples: TensorSample[], n: number): void => {
    const remainder = samples.length % n;
    for (let i = 0; i < (n - remainder); i++) {
        samples.push(getTensorSample(null));
    }
}