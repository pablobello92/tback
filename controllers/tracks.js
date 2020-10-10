
// Es probable que lo que hace el código que me pasaron es:
// si dos ranges son iguales (lat, long) => los "mergea",
// caso contrario los pushea a un array con todos los ranges
// Entonces, lo que hay abajo es solo el pusheo, falta el merge de los que son iguales

// De todos modos, si voy a andar haciendo esto todo el tiempo no tiene sentido:
// Tengo 3 funcionalidades:
// 1: traer tracks de un usuario y visualizarlos con colores independientes (TODO)
// 2: traer tracks de un usuario y visualizarlos con colores dependientes (merge) (TODO)
// 3: traer tracks de TODOS los usuarios y visualizarlos con colores dependientes (merge) (TODO)

// Lo que hice hasta ahora es un "traer, con colores dependientes, pero sin mergear"
const getTracks = (trackList) => {
    let ranges = [];
    trackList.forEach(track => {
        ranges.push(...track.ranges);
    });
    return ranges;
}

module.exports = getTracks;