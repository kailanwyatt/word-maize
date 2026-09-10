/** Maze-only artwork. Native text supplies all letters and labels. */
export const mazeAssets = {
  dirt: require('./dirt-v3.png'),
  wall: require('./wall-v1.png'),
  walls: [
    require('./wall-tall-01.png'),
    require('./wall-tall-02.png'),
    require('./wall-v1.png'),
    require('./wall-v2.png'),
  ],
  plants: {
    closed: require('./closed-letter-v1.png'),
    inspected: require('./inspected-v1.png'),
    open: require('./open-v4.png'),
    empty: require('./empty-v3.png'),
  },
  farmers: {
    patch: {
      up: {
        idle: require('./characters/patch/up-idle.png'),
        walk: [require('./characters/patch/up-walk-a.png'), require('./characters/patch/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/patch/down-idle.png'),
        walk: [require('./characters/patch/down-walk-a.png'), require('./characters/patch/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/patch/left-idle.png'),
        walk: [require('./characters/patch/left-walk-a.png'), require('./characters/patch/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/patch/right-idle.png'),
        walk: [require('./characters/patch/right-walk-a.png'), require('./characters/patch/right-walk-b.png')],
      },
    },
    may: {
      up: {
        idle: require('./characters/may/up-idle.png'),
        walk: [require('./characters/may/up-walk-a.png'), require('./characters/may/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/may/down-idle.png'),
        walk: [require('./characters/may/down-walk-a.png'), require('./characters/may/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/may/left-idle.png'),
        walk: [require('./characters/may/left-walk-a.png'), require('./characters/may/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/may/right-idle.png'),
        walk: [require('./characters/may/right-walk-a.png'), require('./characters/may/right-walk-b.png')],
      },
    },
    sprout: {
      up: {
        idle: require('./characters/sprout/up-idle.png'),
        walk: [require('./characters/sprout/up-walk-a.png'), require('./characters/sprout/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/sprout/down-idle.png'),
        walk: [require('./characters/sprout/down-walk-a.png'), require('./characters/sprout/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/sprout/left-idle.png'),
        walk: [require('./characters/sprout/left-walk-a.png'), require('./characters/sprout/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/sprout/right-idle.png'),
        walk: [require('./characters/sprout/right-walk-a.png'), require('./characters/sprout/right-walk-b.png')],
      },
    },
    reed: {
      up: {
        idle: require('./characters/reed/up-idle.png'),
        walk: [require('./characters/reed/up-walk-a.png'), require('./characters/reed/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/reed/down-idle.png'),
        walk: [require('./characters/reed/down-walk-a.png'), require('./characters/reed/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/reed/left-idle.png'),
        walk: [require('./characters/reed/left-walk-a.png'), require('./characters/reed/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/reed/right-idle.png'),
        walk: [require('./characters/reed/right-walk-a.png'), require('./characters/reed/right-walk-b.png')],
      },
    },
    cedar: {
      up: {
        idle: require('./characters/cedar/up-idle.png'),
        walk: [require('./characters/cedar/up-walk-a.png'), require('./characters/cedar/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/cedar/down-idle.png'),
        walk: [require('./characters/cedar/down-walk-a.png'), require('./characters/cedar/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/cedar/left-idle.png'),
        walk: [require('./characters/cedar/left-walk-a.png'), require('./characters/cedar/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/cedar/right-idle.png'),
        walk: [require('./characters/cedar/right-walk-a.png'), require('./characters/cedar/right-walk-b.png')],
      },
    },
    lin: {
      up: {
        idle: require('./characters/lin/up-idle.png'),
        walk: [require('./characters/lin/up-walk-a.png'), require('./characters/lin/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/lin/down-idle.png'),
        walk: [require('./characters/lin/down-walk-a.png'), require('./characters/lin/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/lin/left-idle.png'),
        walk: [require('./characters/lin/left-walk-a.png'), require('./characters/lin/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/lin/right-idle.png'),
        walk: [require('./characters/lin/right-walk-a.png'), require('./characters/lin/right-walk-b.png')],
      },
    },
    sol: {
      up: {
        idle: require('./characters/sol/up-idle.png'),
        walk: [require('./characters/sol/up-walk-a.png'), require('./characters/sol/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/sol/down-idle.png'),
        walk: [require('./characters/sol/down-walk-a.png'), require('./characters/sol/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/sol/left-idle.png'),
        walk: [require('./characters/sol/left-walk-a.png'), require('./characters/sol/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/sol/right-idle.png'),
        walk: [require('./characters/sol/right-walk-a.png'), require('./characters/sol/right-walk-b.png')],
      },
    },
    nia: {
      up: {
        idle: require('./characters/nia/up-idle.png'),
        walk: [require('./characters/nia/up-walk-a.png'), require('./characters/nia/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/nia/down-idle.png'),
        walk: [require('./characters/nia/down-walk-a.png'), require('./characters/nia/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/nia/left-idle.png'),
        walk: [require('./characters/nia/left-walk-a.png'), require('./characters/nia/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/nia/right-idle.png'),
        walk: [require('./characters/nia/right-walk-a.png'), require('./characters/nia/right-walk-b.png')],
      },
    },
    clay: {
      up: {
        idle: require('./characters/clay/up-idle.png'),
        walk: [require('./characters/clay/up-walk-a.png'), require('./characters/clay/up-walk-b.png')],
      },
      down: {
        idle: require('./characters/clay/down-idle.png'),
        walk: [require('./characters/clay/down-walk-a.png'), require('./characters/clay/down-walk-b.png')],
      },
      left: {
        idle: require('./characters/clay/left-idle.png'),
        walk: [require('./characters/clay/left-walk-a.png'), require('./characters/clay/left-walk-b.png')],
      },
      right: {
        idle: require('./characters/clay/right-idle.png'),
        walk: [require('./characters/clay/right-walk-a.png'), require('./characters/clay/right-walk-b.png')],
      },
    },
  },
  farmerProfiles: {
    patch: require('./characters/patch/profile.png'),
    may: require('./characters/may/profile.png'),
    sprout: require('./characters/sprout/profile.png'),
    reed: require('./characters/reed/profile.png'),
    cedar: require('./characters/cedar/profile.png'),
    lin: require('./characters/lin/profile.png'),
    sol: require('./characters/sol/profile.png'),
    nia: require('./characters/nia/profile.png'),
    clay: require('./characters/clay/profile.png'),
  },
  landmarks: {
    well: require('./well-v1.png'),
    windmill: require('./windmill-v1.png'),
    trough: require('./trough-v1.png'),
    hay: require('./hay-v1.png'),
    cart: require('./cart-v1.png'),
    rock: require('./landmarks/rock.png'),
    signpost: require('./landmarks/signpost.png'),
    sunflowers: require('./landmarks/sunflowers.png'),
    scarecrow: require('../powerups/scarecrow.png'),
  },
  tools: {
    tractor: [require('./tools/tractor-right.png'), require('./tools/tractor-right-b.png')],
    mower: [require('./tools/mower-right.png'), require('./tools/mower-right-b.png')],
    chaff: require('./tools/chaff.png'),
  },
  crate: require('./crate.png'),
  wildlife: {
    crow: require('./wildlife/crow.png'),
    squirrel: require('./wildlife/squirrel.png'),
    caterpillar: require('./wildlife/caterpillar.png'),
  },
} as const;
