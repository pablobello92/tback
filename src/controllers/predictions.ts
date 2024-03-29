export {};

import express from 'express';
import Prediction from '../schemas/prediction';
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
    getTracksMappedByCity
} from './tracks';
import { 
    replaceSumarizations
} from './sumarizations';
import {
    IAccelerometer,
    IRange,
    ISegment,
    IStabilityEvent,
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
    PREDICTION_TYPES,
    TENSOR_SAMPLE_SIZE
} from '../shared/constants';

export const executePredictionsCallback = (req: express.Request, res: express.Response): void => {
    const type: PREDICTION_TYPES = parseInt(req.body.type);
    const filter: any = {
        id: req.body.linkedCities
    };
    getTracksMappedByCity(filter, 'cityId startTime ranges accelerometers')
        .pipe(
            applyTransformation(type)
        )
        .subscribe((result: any) => {
            console.log(result)
            res.status(200).end();
        }, (error: Error) => {
            res.status(500).end();
        });
}

const applyTransformation = (type: number) => <T>(source$: Observable<T>) => {
    const transformation = (type === PREDICTION_TYPES.ROADS) ? roads : anomalies;
    return source$.pipe(transformation(type));
}

const anomalies = (type: number) => <T>(source$: Observable<T>) => source$
    .pipe(
        map((tracksByCity: T) => tracksByCity as unknown as ISumarizingObject[]),
        map((tracksByCity: ISumarizingObject[]) => firstMappingAnomalies(tracksByCity, type)),
        // switchMap((tensorsByCity: ISumarizedObject[]) => mapTensorToPrediction(tensorsByCity, type)),
        // switchMap((predictionsByCity: ISumarizedObject[]) => replaceSumarizations(predictionsByCity, type)),
        map((tensorsByCity: ISumarizedObject[]) => 'FINALIZO ANOMALIAS!!')
    );

const firstMappingAnomalies = (tracksByCity: ISumarizingObject[], type: number): ISumarizedObject[] =>
    tracksByCity.map((item: ISumarizingObject) =>
		<ISumarizedObject> {
            type,
			cityId: item.cityId,
			date: Date.parse(new Date().toDateString()),
			ranges: foo(item.tracks, type)
		}
	);

const foo = (tracks: ITrack[], type: number): IPredictionSegment[] => {
    let segments: IPredictionSegment[] = [];
    let result: IPredictionSegment[] = [];

    console.clear();
    console.log('PREDICCION: ', type);
    tracks.forEach((t: ITrack) => {
        segments.push(...getPredictionSegmentsFromTrack(t, type));
    });

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

// si type == 1 ===> primero predict()luego sumarizar predicciones 
const mapTracksToMergedPredictionSegments = (tracks: ITrack[], type: number): IPredictionSegment[] => {
    let segments: IPredictionSegment[] = [];
    let result: IPredictionSegment[] = [];

    console.clear();
    console.log('PREDICCION: ', type);
    tracks.forEach((t: ITrack) => {
        segments.push(...getPredictionSegmentsFromTrack(t, type));
    });

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

const getPredictionSegmentsFromTrack = (track: ITrack, type: number): IPredictionSegment[] => {
    const firstFilter = discardAccelerometers(track.accelerometers, type);
    return track.ranges.map((r: IRange, i) => {
        const secondFilter = filterAccelerometersByRange(r, firstFilter, type);
        return mapToPredictionSegment(r, secondFilter);
    });
}

const filterAccelerometersByRange = (range: IRange, accelerometers: IAccelerometer[], type: number): IAccelerometer[] => {  
    if (type === 0) {
        return accelerometers.filter((a: IAccelerometer) => a.id === range.id);
    } else if (type === 1) {
        const ids: number[] = range.stabilityEvents.map((e: IStabilityEvent) => e.id);
        return accelerometers.filter((a: IAccelerometer) => (ids.indexOf(a.eventId) !== -1));
    } else {
        return [];
    }
}

const discardAccelerometers = (accelerometers: IAccelerometer[], type: number): IAccelerometer[] => {
    if (type === 0) {
        return accelerometers.filter((a: IAccelerometer) => a.eventId === -1)
    }
    return accelerometers.filter((a: IAccelerometer) => a.eventId !== -1)
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
		samples: accelerometers.map((a: IAccelerometer) => getTensorSample(a) as number[][])
	};
}

const mapTensorToPrediction = (items: ISumarizedObject[], type: number): Observable<ISumarizedObject[]> =>
    from(loadModel(PATHS[type]))
    .pipe(
        map((model: LayersModel) => items.map((item: ISumarizedObject) => addScores(model, item)))
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
    return getMostCommonValue(scores);
}

const predictSample = (sample: any, model: LayersModel): any => {
    const tensor: Tensor4D = tensor4d(sample);
    const result: Tensor<Rank> = model.predict(tensor) as Tensor;
    return result.dataSync();
}

const getPredominantType = (array: Float32Array): number => {
    return array.indexOf(Math.max(...array));
}

const getMostCommonValue = (items: number[]): number => {
    let count = 0;
    let higherCount = 1;
    let result: number = items[0];
    for (let i = 0; i < items.length; i++) {
        for (let j = i; j < items.length; j++) {
            if (items[i] == items[j]) {
                count++;
                if (higherCount < count) {
                    higherCount = count; 
                    result = items[i];
                }
            }       
        }
        count = 0;
    }
    return result;
}

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


const roads = (type: number) => <T>(source$: Observable<T>) => source$
    .pipe(
        map((tracksByCity: T) => tracksByCity as unknown as ISumarizingObject[]),
        map((tracksByCity: ISumarizingObject[]) => firstMappingRoads(tracksByCity, type)),
        switchMap((tensorsByCity: ISumarizedObject[]) => mapTensorToPrediction(tensorsByCity, type)),
        // switchMap((predictionsByCity: ISumarizedObject[]) => replaceSumarizations(predictionsByCity, type)),
        map((tensorsByCity: ISumarizedObject[]) => 'FINALIZO ROADS!!')
    );

const firstMappingRoads = (tracksByCity: ISumarizingObject[], type: number): ISumarizedObject[] =>
    tracksByCity.map((item: ISumarizingObject) =>
		<ISumarizedObject> {
            type,
			cityId: item.cityId,
			date: Date.parse(new Date().toDateString()),
			ranges: mapTracksToMergedPredictionSegments(item.tracks, type)
		}
	);