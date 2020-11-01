export {};
import {
    getCenter,
    getDistance
} from 'geolib';

import City from '../models/city';
import Sumarization from '../models/sumarization';
import Track from '../models/track';

import {
    IRange,
    ITrack,
    SumarizingObject,
    SumarizingSegment
} from '../interfaces/Sumarizations';

import {
    Observable
} from 'rxjs';
import {
    of
} from 'rxjs/internal/observable/of';
import {
    map
} from 'rxjs/operators';
import {
    sumarizingObjects
} from './mocks';

const sumarizeTracksCallback = (req, res): void => {
    of(sumarizingObjects)
    .pipe(
        map((mock: SumarizingObject[]) => mock.map((item: SumarizingObject) => sumarizeByCity(item)))
    )
    .subscribe(result => {
        console.log(result);
        Sumarization.deleteMany({})
        .then(deletion => {
            Sumarization.insertMany(result)
            .then(result => {   
                res.send(result);   
            })
            .catch(error => {
                throw error;
            });
        })
        .catch(error => {
            throw error;
        });    
    }, err => {
        console.error(err);
        throw err;
    });
}

/*const getTracksMapped = (): Observable<SumarizingObject[]> => {
    return getCityNames()
    .then((cityNames: string[]) => {
        let result = [];
        cityNames.forEach(cityName => {
            result.push(getTracksByCity(cityName))
        });
        return Promise.all(result)
        .then(tracks => {
            const objects = tracks.map((tracks, index) => {
                return {
                    city: cityNames[index],
                    tracks
                };
            });
            return objects;
        })
        .then(objects => {
            return objects;
        })
        .catch(error => {
            throw error;
        });
    })
    .catch(error => {
        throw error;
    });
}*/

const sumarizeByCity = (item: SumarizingObject): any => {
    const ranges: SumarizingSegment[] = [];
    const tracks = item.tracks;
    tracks.forEach((track: ITrack) => {
        addSumarizedSegmentsByTrack(ranges, track);
    });
    return {
        city: item.city,
        date: Date.parse(new Date().toDateString()),
        ranges
    };
}

const addSumarizedSegmentsByTrack = (temp: SumarizingSegment[], track: ITrack): any => {
    const startTime = track.startTime;
    const segments: SumarizingSegment[] = track.ranges.map((item: IRange) => mapRangeToSumarizingRange(item));
    segments.forEach((segment: SumarizingSegment) => {
        addRangeToResult(segment, temp);
    });
}

// add Coordinate = { lat/lng } type to elements
const addRangeToResult = (rangeToMerge: SumarizingSegment, subTemp: SumarizingSegment[]): any => {
    const midpoint = getCenter([rangeToMerge.start, rangeToMerge.end]);
    const toMerge = subTemp.find((range: SumarizingSegment) => shouldMerge(midpoint, range));
    if (!toMerge) {
        rangeToMerge.accuracy = 1;
        subTemp.push(rangeToMerge);
    } else {
        mergeRanges(toMerge, rangeToMerge);
    }
}

const shouldMerge = (point: any, range: any): boolean => {
    const distance = getDistance(range.start, range.end);
    const distanceToStart = getDistance(range.start, point);
    const distanceToEnd = getDistance(range.end, point);
    return distanceToStart < distance && distanceToEnd < distance;
}

const mergeRanges = (oldRange: SumarizingSegment, newRange: SumarizingSegment): void => {
    const NEW_DATA_WEIGHT = 0.6;
    const OLD_DATA_WEIGHT = 1 - NEW_DATA_WEIGHT;
    oldRange.score = oldRange.score * OLD_DATA_WEIGHT + newRange.score * NEW_DATA_WEIGHT;
    oldRange.date = newRange.date;
    oldRange.accuracy++;
}

const mapRangeToSumarizingRange = (range: IRange): SumarizingSegment => {
    const {
        speed,
        stabilityEvents,
        ...relevantFields
    } = range;
    return <SumarizingSegment > {
        ...relevantFields,
        accuracy: 0
    };
}

const getSumarizationsByFilter = async (filter: {}) => {
    try {
        const sumarizations: any[] = await Sumarization.find(filter)
        if (!sumarizations) {
            return [];
        }
        return sumarizations;
    } catch (error) {
        throw new Error("Error getting the Sumarizations");
    }
}

const getSumarizationsCallback = (req, res): void => {
    const filter = {
        city: req.query.city
    };
    getSumarizationsByFilter(filter)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        });
}

const getCityNames = async () => {
    try {
        const cities = < any > await City.find();
        if (!cities) {
            return [];
        }
        return cities.map(city => city.name);
    } catch (error) {
        throw new Error("error getting the cities");
    }
}

const getTracksByCity = async (cityName: string) => {
    try {
        const tracks: any[] = await Track.find({
            city: cityName
        }).limit(5)
        if (!tracks) {
            return [];
        }
        const result = tracks.map(track => {
            return {
                startTime: track.startTime,
                ranges: track.ranges
            };
        });
        return result;
    } catch (error) {
        throw new Error("error getting the cities");
    }
}

//TODO: pass the data as parameter, it's not a get callback anymore
const putSumarizationsCallback = (req, res): void => {
    Sumarization.deleteMany({})
        .then(response => {
            Sumarization.insertMany(req.body)
                .then(insertResponse => {
                    res.send(insertResponse);
                })
                .catch(err => {
                    res.send(err);
                });
        })
        .catch(error => {
            res.send(error);
            res.end();
        });
}

export {
    sumarizeTracksCallback,
    getSumarizationsCallback
};