

export const TENSOR_SAMPLE_SIZE = 85;

export enum PATHS {
    ROADS ='file://src/assets/tensorFlowCore/roads/model.json',
    ANOMALIES = 'file://src/assets/tensorFlowCore/anomalies/model.json',
};

export enum ROAD_TYPES {
    ASPHALT = 0,
    COBBLES = 1,
    CONCRETE = 2,
    EARTH = 3,
}

export enum ROAD_TYPES_DESCRIPTION {
    ASPHALT = 'Asphalt',
    COBBLES = 'Cobbles',
    CONCRETE = 'Concrete',
    EARTH = 'Earth',
}


export enum ANOMALIES {
    USER_ANSWERED_CALL = 0,
    USER_USED_DOOR = 1,
    USER_REPLIED_MESSAGE = 2,
    POTHOLE = 3,
    SPEED_BUMP = 4,
    STREET_GUTTER = 5,
}

export enum ANOMALIES_DESCRIPTION {
    USER_ANSWERED_CALL = 'User answered a call',
    USER_USED_DOOR = 'USer open or closed a door',
    USER_REPLIED_MESSAGE = 'User replied a message',
    POTHOLE = 'Pothole',
    SPEED_BUMP = 'Speed Bump',
    STREET_GUTTER = 'Street Gutter',
}