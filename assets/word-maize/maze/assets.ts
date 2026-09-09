/** Maze-only artwork. Native text supplies all letters and labels. */
export const mazeAssets = {
  dirt: require('./dirt-v3.png'),
  wall: require('./wall-v2.png'),
  wallAlt: require('./wall-b-v2.png'),
  wallDense: require('./wall-v1.png'),
  plants: {
    closed: require('./closed-letter-v1.png'),
    inspected: require('./inspected-v1.png'),
    open: require('./open-v4.png'),
    empty: require('./empty-v3.png'),
  },
  farmer: {
    up: {
      idle: require('./farmer-up-idle-v2.png'),
      walk: [require('./farmer-up-walk-a-v2.png'), require('./farmer-up-walk-b-v2.png')],
    },
    down: {
      idle: require('./farmer-down-idle-v2.png'),
      walk: [require('./farmer-down-walk-a-v2.png'), require('./farmer-down-walk-b-v2.png')],
    },
    left: {
      idle: require('./farmer-left-idle-v2.png'),
      walk: [require('./farmer-left-walk-a-v2.png'), require('./farmer-left-walk-b-v2.png')],
    },
    right: {
      idle: require('./farmer-right-idle-v2.png'),
      walk: [require('./farmer-right-walk-a-v2.png'), require('./farmer-right-walk-b-v2.png')],
    },
  },
  landmarks: {
    well: require('./well-v1.png'),
    windmill: require('./windmill-v1.png'),
    trough: require('./trough-v1.png'),
    hay: require('./hay-v1.png'),
    cart: require('./cart-v1.png'),
  },
  chrome: {
    sunny: require('./chrome-sunny.jpg'),
    evening: require('./chrome-evening.jpg'),
    mist: require('./chrome-mist.jpg'),
    storm: require('./chrome-storm.jpg'),
  },
  footer: {
    sunny: require('./footer-sunny.jpg'),
    evening: require('./footer-evening.jpg'),
    mist: require('./footer-mist.jpg'),
    storm: require('./footer-storm.jpg'),
  },
} as const;
