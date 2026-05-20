export const MATERIAL_TOKENS = {
    grass: 0x7fa764,
    grassDark: 0x5f7f4c,
    grassLight: 0x9ec177,
    road: 0x4b4f55,
    roadEdge: 0x6c7075,
    sidewalk: 0xd8cdb8,
    crosswalk: 0xf3efe2,
    creamWall: 0xf1eadc,
    warmWhite: 0xfff7e8,
    houseRoof: 0xa8473f,
    supermarketBlue: 0x3e6f96,
    marketGreen: 0x5fa877,
    schoolBrick: 0xa84f3f,
    wood: 0x8b5a32,
    darkWood: 0x5c3923,
    stone: 0xb7afa2,
    metal: 0x74777a,
    accentYellow: 0xffd15c,
    accentRed: 0xc84f45,
    accentBlue: 0x4e86c8,
    water: 0x4f9fdd,
};

export const LANDMARKS = {
    home: { name: '我的家', shortName: '家', x: -25, z: -25, accent: MATERIAL_TOKENS.houseRoof },
    supermarket: { name: '罗森超市', shortName: '超市', x: 25, z: -25, accent: MATERIAL_TOKENS.supermarketBlue },
    market: { name: '菜市场', shortName: '市场', x: -25, z: 25, accent: MATERIAL_TOKENS.marketGreen },
    school: { name: '阳光学院', shortName: '学校', x: 25, z: 25, accent: MATERIAL_TOKENS.schoolBrick },
    farm: { name: '绿色农田', shortName: '农田', x: 0, z: 0, accent: MATERIAL_TOKENS.grassDark },
};

export const STREET_FURNITURE = {
    benches: [
        [-17, -7, Math.PI / 2],
        [17, -7, Math.PI / 2],
        [-17, 7, Math.PI / 2],
        [17, 7, Math.PI / 2],
        [-33, 18, 0],
        [34, 18, 0],
    ],
    planters: [
        [-12, -4], [-12, 4], [12, -4], [12, 4],
        [-30, -15], [30, -15], [-30, 15], [30, 15],
    ],
    signPosts: [
        { x: -18, z: -16, accent: MATERIAL_TOKENS.houseRoof },
        { x: 17, z: -15, accent: MATERIAL_TOKENS.supermarketBlue },
        { x: -17, z: 16, accent: MATERIAL_TOKENS.marketGreen },
        { x: 17, z: 16, accent: MATERIAL_TOKENS.schoolBrick },
        { x: 9, z: 10, accent: MATERIAL_TOKENS.grassDark },
    ],
};
