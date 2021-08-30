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
    getTracksMapByCity
} from './tracks';
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
    TENSOR_SAMPLE_SIZE
} from '../shared/constants';

export const executePredictionsCallback = (req: express.Request, res: express.Response): void => {
    const type: number = parseInt(req.body.type);
    const filter: any = {
        id: req.body.linkedCities
    };

    getTracksMapByCity(filter, 'cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sampleTracksByCity(allData, type)),
            switchMap((allData: ISumarizedObject[]) => predictSamplesByCity(allData, type)),
            switchMap((predictionsByCity: ISumarizedObject[]) => replacePredictions(predictionsByCity, type))
        )
        .subscribe((result: any) => {
            res.status(200).end();
        }, (error: Error) => {
            res.status(500).end();
        });
}

const sampleTracksByCity = (items: ISumarizingObject[], type: number): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) =>
		<ISumarizedObject> {
            type,
			cityId: item.cityId,
			date: Date.parse(new Date().toDateString()),
			ranges: sampleTracks(item, type)
		}
	);

const sampleTracks = (item: ISumarizingObject, type: number): IPredictionSegment[] => {
    const result: IPredictionSegment[] = [];

    let ranges: IRange[] = [];
    let accelerometers: IAccelerometer[] = [];
    let segments: IPredictionSegment[] = [];

    item.tracks.forEach((track: ITrack) => {
        ranges.push(...track.ranges);
        accelerometers.push(...track.accelerometers);
    });

    const firstFilter = discardAccelerometers(accelerometers, type);
    segments = ranges.map((r: IRange) => {
        const secondFilter = filterAccelerometersByRange(r, firstFilter, type);
        return mapToPredictionSegment(r, secondFilter);
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

// If a range has ids.length = 0 ==> no anomalies ==> 
// should have a score of -1 which means "no anomalies"
// should return a null result which later is casted to a -1 score

//! LUEGO CHEQUEAR QUE LAS CANTIDADES SON 100% COMPLEMENTARIAS Y CORRECTAS
//! CREO QUE HABIA INCONGRUENCIAS EN LOS LENGTH!!
//! OJO QUE PUEDE DEBERSE A ALGUNA INCONGRUENCIA EN LOS TRACKS, Y NO EN MI CODIGO
const filterAccelerometersByRange = (range: IRange, accelerometers: IAccelerometer[], type: number): IAccelerometer[] => {
    const all = accelerometers.filter((a: IAccelerometer) => a.id === range.id);
    if (type === 0) {
        return all;
    } else if (type === 1) {
        const ids: number[] = range.stabilityEvents.map((e: IStabilityEvent) => e.id);
        return filterByAnomaly(all, ids);
    }
    return undefined;
}

const filterByAnomaly = (all: IAccelerometer[], ids: number[]): IAccelerometer[] =>
    all.filter((a: IAccelerometer) => (ids.indexOf(a.eventId) !== -1));

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

// TODO: acá va la lógica para aquellos rangos que no tienen acelerometros asociados
// (solo va a pasar para prediccion de anomalias)
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

const predictSamplesByCity = (items: ISumarizedObject[], type: number): Observable<ISumarizedObject[]> =>
    from(loadModel(PATHS[type]))
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

const replacePredictions = (values: any, type: number): Observable<Error | any> =>
    from(removePredictions({ type }))
    .pipe(
        switchMap((res: any) => insertPredictions(values))
    );

const removePredictions = (filter: {}): Promise<Error | any> =>
    Prediction.deleteMany(filter)
        .catch((error: any) => new Error(error));

const insertPredictions = (values: any): Promise<Error | any> =>
    Prediction.insertMany(values)
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


export const getPredictionsCallback = (req: express.Request, res: express.Response): void => {
    const filter = {
        type: req.query.type,
        cityId: req.query.cityId
    };
    getPredictionsByFilter(filter)
        .then((result: any) => {
            res.send(result);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
}

const getPredictionsByFilter = (filter: {}): Promise<Error | any> =>
    Prediction.findOne(filter).lean()
        .catch((error: any) => new Error(error));