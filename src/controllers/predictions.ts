export {};

import express from 'express';
import PredictedRoadTypes from '../models/predictedRoadTypes';
import {
    getCenter,
    getDistance
} from 'geolib';
import {
    map,
    switchMap
} from 'rxjs/operators';
import { 
    from,
    Observable,
    of
} from 'rxjs';
import {
    Tensor4D,
    tensor4d,
    Tensor,
    loadLayersModel,
    Rank,
    LayersModel,
    Tensor3D,
    TensorLike
} from '@tensorflow/tfjs-node';
import {
    getTracksMapByCity
} from './tracks';
import {
    IAccelerometer,
    IBaseSegment,
    IPredictionSegment,
    IRange,
    ISumarizedObject,
    ISumarizingObject,
    ITrack,
    TensorSample
} from '../interfaces/Track';
import { 
    PATHS,
    TENSOR_SAMPLE_SIZE
} from '../shared/constants';

export const predictRoadsCallback = (req: express.Request, res: express.Response): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR SUELOS');
    console.log('----------------');
    
    // TODO: añadir soporte para filtrado en getTracksMapByCity()
    // TODO: agregar filtrado por campo req.body.linkedCities

    getTracksMapByCity('cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sampleTracksByCity(allData)),
            switchMap((allData: ISumarizedObject[]) => predictSamplesByCity(allData)),
            //switchMap((predictionsByCity: ISumarizedObject[]) => replacePredictions(predictionsByCity))
        )
        .subscribe((result: any) => {
            res.status(200).send(result);
            res.end();
        }, (error: Error) => {
            res.status(500).send(error);
            res.end();
        });
}

const predictSamplesByCity = (items: ISumarizedObject[]): Observable<ISumarizedObject[]> =>
    from(loadModel(PATHS.ROADS))
    .pipe(
        map((model: LayersModel) => items.map((item: ISumarizedObject) => {
            item.ranges.forEach((r: IPredictionSegment) => {
                r.score = calculateScore(r.samples, model);
            });
            return item;
        }))
    )

const loadModel = (path: string): Promise<LayersModel | Error> =>
    loadLayersModel(path)
    .catch((error: any) => new Error(error))

const calculateScore = (samples: TensorSample[], model: LayersModel): number => {
    const WINDOWS = (samples.length / TENSOR_SAMPLE_SIZE);
    for (let i = 0; i < WINDOWS; i++) {
        let temp = samples.slice(i * TENSOR_SAMPLE_SIZE, (i * TENSOR_SAMPLE_SIZE) + TENSOR_SAMPLE_SIZE);
        const scores = predictSample([temp] as number[][][][], model);
        console.log(scores);
    }
    // retornar el que mas se repite??
    return 99;
}

const predictSample = (sample: any, model: LayersModel): any => {
    const tensor: Tensor4D = tensor4d(sample);
    const result: Tensor<Rank> = model.predict(tensor) as Tensor;
    return result.dataSync();
}

const sampleTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) =>
		<ISumarizedObject> {
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

const replacePredictions = (values: any): Observable<Error | any> =>
    from(removePredictions())
    .pipe(
        switchMap((res: any) => insertPredictions(values))
    );

const removePredictions = (): Promise<Error | any> =>
    PredictedRoadTypes.deleteMany({})
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

/**
 * ?------------------
 * ? ANOMALIAS
 * ?------------------
 */

export const predictAnomaliesCallback = (req: express.Request, res: express.Response): void => {
    res.send(["anomalies predicted!"]);
}



/**
 * ? --------------------------------------
 * ? FUNCIONES COMUNES A AMBAS PREDICCIONES
 * ? --------------------------------------
 */

const findMatchingSegment = (mySegment: IBaseSegment, array: IBaseSegment[]): number =>
    array.findIndex((s: IBaseSegment) => matches(mySegment, s));

const matches = (a: IBaseSegment, b: IBaseSegment): boolean => {
    const center: any = getCenter([a.start, a.end]);
    const length: number = getDistance(b.start, b.end);
    const distanceToStart: number = getDistance(b.start, center);
    const distanceToEnd: number = getDistance(b.end, center);
    return (
        distanceToStart < length &&
        distanceToEnd < length
    );
}